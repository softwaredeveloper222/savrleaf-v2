import axios from "axios";

export const purchaseSubscription = async (subscriptionId: string) => {
  try {
    const subscription = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/create-subscription-session`, { subscriptionId });
    const { url } = subscription.data;
    if (url) {
      window.location.href = url;
    } else {
      throw new Error('Failed to create Stripe Checkout session.');
    }
  } catch (error) {
    console.error('Error purchasing subscription', error);
    return { error: 'Failed to purchase subscription.' };
  }
}