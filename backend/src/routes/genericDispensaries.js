import express from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import GenericDispensary from '../models/GenericDispensary.js';
import authMiddleware, { adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function normalizeKey(s) {
  return String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function mapRowToDispensary(row) {
  const get = (...names) => {
    const keys = Object.keys(row || {});
    const lower = (k) => k.toLowerCase().trim();
    for (const n of names) {
      const nNorm = n.toLowerCase().trim().replace(/\s/g, '');
      const found = keys.find((k) => {
        const v = lower(k).replace(/\s/g, '');
        return v === nNorm || lower(k) === n.toLowerCase();
      });
      if (found != null && row[found] != null && String(row[found]).trim() !== '') {
        return String(row[found]).trim();
      }
    }
    return null;
  };

  // Name: Dispensary Name, fallback to Owner/Operator
  const name = get('Dispensary Name', 'dispensary name', 'name', 'dispensary', 'Owner/Operator', 'owner operator', 'owner/operator', 'business name');
  const street1Col = get('address', 'street', 'street1', 'address1', 'street address');
  const street2 = get('street2', 'address2');
  const city = get('City', 'city');
  const state = get('State', 'state', 'st');
  const zipRaw = get('ZIP Code', 'zip code', 'zip', 'zipcode', 'zipcode');
  const zipCode = zipRaw ? String(zipRaw).replace(/\D/g, '').slice(0, 10) : null;

  // Required: name, city, state, zipCode (no street column in sample – we derive street1)
  if (!name || !city || !state || !zipCode) return null;

  const street1 = street1Col || `${city}, ${state} ${zipCode}`;

  // Contact Information: can be email or phone
  const contact = get('Contact Information', 'contact information', 'contact', 'contact info', 'phone', 'phonenumber', 'phone number', 'email', 'tel', 'telephone');
  let phoneNumber;
  let email;
  if (contact) {
    if (contact.includes('@')) {
      email = contact;
    } else if (/\d/.test(contact)) {
      phoneNumber = contact;
    }
  }

  const website = get('WebSite URL', 'website url', 'website', 'websiteurl', 'url', 'web');
  const description = get('description');
  const license = get('license', 'licensenumber', 'license number', 'license #');

  return {
    name,
    address: { street1, street2: street2 || undefined, city, state, zipCode },
    licenseNumber: license || undefined,
    websiteUrl: website || undefined,
    phoneNumber: phoneNumber || undefined,
    email: email || undefined,
    description: description || undefined,
    amenities: [],
  };
}

router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const list = await GenericDispensary.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, genericDispensaries: list });
  } catch (err) {
    console.error('Error listing generic dispensaries:', err);
    res.status(500).json({ success: false, message: 'Failed to load generic dispensaries' });
  }
});

router.post('/upload', authMiddleware, adminMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Use field name "file".' });
    }
    const fname = (req.file.originalname || '').toLowerCase();
    const isCsv = fname.endsWith('.csv');
    const isExcel = fname.endsWith('.xlsx') || fname.endsWith('.xls');
    if (!isCsv && !isExcel) {
      return res.status(400).json({ success: false, message: 'File must be .csv, .xlsx, or .xls' });
    }

    let rows;
    if (isCsv) {
      const str = req.file.buffer.toString('utf-8');
      const workbook = XLSX.read(str, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return res.status(400).json({ success: false, message: 'CSV file could not be read' });
      }
      rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return res.status(400).json({ success: false, message: 'Excel file has no sheets' });
      }
      rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    const existing = await GenericDispensary.find().lean();
    const existingKeys = new Set(
      existing.map((d) =>
        normalizeKey([d.name, d.address?.street1, d.address?.city, d.address?.state, d.address?.zipCode].join('|'))
      )
    );

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const data = mapRowToDispensary(row);
      if (!data) {
        if (row && (row.name || row.Name || row['Dispensary Name'] || row['Owner/Operator'])) {
          errors.push(`Row ${i + 2}: missing required fields (Dispensary Name or Owner/Operator, City, State, ZIP Code)`);
        }
        skipped++;
        continue;
      }      

      const key = normalizeKey(
        [data.name, data.address.street1, data.address.city, data.address.state, data.address.zipCode].join('|')
      );
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }

      try {
        await GenericDispensary.create(data);
        existingKeys.add(key);
        imported++;
      } catch (e) {
        errors.push(`Row ${i + 2}: ${e.message || 'validation error'}`);
        skipped++;
      }
    }

    res.json({
      success: true,
      imported,
      skipped,
      duplicateSkipped: skipped,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error('Error uploading generic dispensaries:', err);
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, address, licenseNumber, websiteUrl, phoneNumber, email, description } = req.body;

    if (!name || !address?.city || !address?.state || !address?.zipCode) {
      return res.status(400).json({ success: false, message: 'Name, city, state, and zip code are required' });
    }

    const created = await GenericDispensary.create({
      name,
      address,
      licenseNumber: licenseNumber || undefined,
      websiteUrl: websiteUrl || undefined,
      phoneNumber: phoneNumber || undefined,
      email: email || undefined,
      description: description || undefined,
      amenities: [],
    });

    res.status(201).json({ success: true, genericDispensary: created });
  } catch (err) {
    console.error('Error creating generic dispensary:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create generic dispensary' });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, address, licenseNumber, websiteUrl, phoneNumber, email } = req.body;
    const updated = await GenericDispensary.findByIdAndUpdate(
      req.params.id,
      { name, address, licenseNumber, websiteUrl, phoneNumber, email },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Generic dispensary not found' });
    res.json({ success: true, genericDispensary: updated });
  } catch (err) {
    console.error('Error updating generic dispensary:', err);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const d = await GenericDispensary.findByIdAndDelete(req.params.id);
    if (!d) return res.status(404).json({ success: false, message: 'Generic dispensary not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting generic dispensary:', err);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

export default router;
