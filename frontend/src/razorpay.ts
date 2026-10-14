// Builds the Razorpay Standard Checkout HTML used inside a WebView (native) and
// loads the checkout script on web. Works in Expo Go (no native module needed).
export function checkoutHtml(opts: { key: string; subscription_id: string; email?: string; name?: string }) {
  const options = JSON.stringify({
    key: opts.key,
    subscription_id: opts.subscription_id,
    name: "EmotiCoach Kids",
    description: "Premium monthly access",
    prefill: { email: opts.email || "", name: opts.name || "" },
    theme: { color: "#E76F51" },
  });
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script></head>
<body style="background:#FDFBF7;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<p>Opening secure checkout…</p>
<script>
var o=${options};
o.handler=function(r){window.ReactNativeWebView.postMessage(JSON.stringify({type:'success',data:r}))};
o.modal={ondismiss:function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'dismiss'}))}};
var rz=new Razorpay(o);
rz.on('payment.failed',function(e){window.ReactNativeWebView.postMessage(JSON.stringify({type:'failed',error:e.error&&e.error.description}))});
rz.open();
</script></body></html>`;
}

export function openWebCheckout(opts: { key: string; subscription_id: string; email?: string; name?: string }): Promise<any> {
  return new Promise((resolve, reject) => {
    const w: any = typeof window !== "undefined" ? window : null;
    if (!w) return reject(new Error("No window"));
    const run = () => {
      const rz = new w.Razorpay({
        key: opts.key,
        subscription_id: opts.subscription_id,
        name: "EmotiCoach Kids",
        description: "Premium monthly access",
        prefill: { email: opts.email, name: opts.name },
        theme: { color: "#E76F51" },
        handler: (r: any) => resolve(r),
        modal: { ondismiss: () => reject(new Error("dismissed")) },
      });
      rz.on("payment.failed", (e: any) => reject(new Error(e?.error?.description || "Payment failed")));
      rz.open();
    };
    if (w.Razorpay) return run();
    const s = w.document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = run;
    s.onerror = () => reject(new Error("Could not load checkout"));
    w.document.body.appendChild(s);
  });
}
