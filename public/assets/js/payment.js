document.addEventListener('DOMContentLoaded', async () => {
  // Step 1: Get the Stripe publishable key from the server.
  const { publishableKey } = await fetch('/config').then((r) => r.json());
  if (!publishableKey) {
    alert('Please set your Stripe publishable API key in the .env file');
    return;
  }

  // Step 2: Initialize Stripe with the publishable key.
  const stripe = Stripe(publishableKey, { apiVersion: '2020-08-27' });

  // Step 3: Retrieve orderAmount from localStorage.
  const retrieveAmt = localStorage.getItem('orderAmount')
  const orderAmount = parseInt(retrieveAmt.replace('$', ''), 10) * 100 || 0;
  console.log(retrieveAmt)

  if (orderAmount < 50) {
    alert('The order amount must be at least 50 cents for SGD.');
    return;
  }

  // Step 4: Create a PaymentIntent by sending `orderAmount` to the server.
  const { clientSecret, error: backendError } = await fetch('/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderAmount }), // Send orderAmount to the server
  }).then(r => r.json());

  if (backendError) {
    alert(backendError.message);
    return;
  }

  // Step 5: Set up Stripe Elements.
  const elements = stripe.elements({ clientSecret });
  const paymentElement = elements.create('payment');
  paymentElement.mount('#payment-element');



  // When the form is submitted...
  const form = document.getElementById('payment-form');
  let submitted = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Disable double submission of the form
    if (submitted) { return; }
    submitted = true;
    form.querySelector('button').disabled = true;

    const nameInput = document.querySelector('#name');

    // Confirm the payment given the clientSecret
    // from the payment intent that was just created on
    // the server.
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/return.html`,
      }
    });

    if (stripeError) {
      addMessage(stripeError.message);

      // reenable the form.
      submitted = false;
      form.querySelector('button').disabled = false;
      return;
    }
  });
});
