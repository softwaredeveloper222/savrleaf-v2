'use client';

interface WeeklyPromotionsProps {
  weeklyPromotions: Record<string, string>;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export default function WeeklyPromotions({ weeklyPromotions }: WeeklyPromotionsProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
      <div className="p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Weekly Promotions</h2>
        <div className="space-y-3">
          {DAYS.map((day) => {
            const promo = weeklyPromotions[day];
            if (!promo) return null;
            const isToday = day === today;
            return (
              <div
                key={day}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  isToday ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                }`}
              >
                <span
                  className={`font-semibold text-sm min-w-[100px] ${
                    isToday ? 'text-orange-700' : 'text-gray-700'
                  }`}
                >
                  {DAY_LABELS[day]}
                  {isToday && (
                    <span className="ml-1 text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </span>
                <span className={`text-sm ${isToday ? 'text-orange-800 font-medium' : 'text-gray-600'}`}>
                  {promo}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
