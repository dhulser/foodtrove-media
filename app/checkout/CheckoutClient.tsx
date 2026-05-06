"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import QuantityControl from "@/components/QuantityControl";
import AdSlot from "@/components/AdSlot";

// Generate a deterministic-looking order ID from timestamp + cart
function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FT-${ts}-${rand}`;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  deliveryOption: "standard" | "express" | "scheduled";
  tip: string;
  // Payment (simulated — no real processing)
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
}

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  deliveryOption: "standard",
  tip: "10",
  cardName: "",
  cardNumber: "",
  cardExpiry: "",
  cardCvc: "",
};

const DELIVERY_OPTIONS = [
  { value: "standard", label: "Standard Delivery", desc: "Within 2 hours", price: 4.99 },
  { value: "express", label: "Express Delivery", desc: "Within 45 minutes", price: 9.99 },
  { value: "scheduled", label: "Schedule Delivery", desc: "Pick a time slot", price: 0 },
] as const;

const TIP_OPTIONS = ["0", "10", "15", "20", "custom"];

export default function CheckoutClient() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [customTip, setCustomTip] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"details" | "payment">("details");

  const deliveryFee = DELIVERY_OPTIONS.find((o) => o.value === form.deliveryOption)?.price ?? 4.99;

  const tipAmount = (() => {
    if (form.tip === "custom") {
      const v = parseFloat(customTip);
      return isNaN(v) ? 0 : v;
    }
    const pct = parseInt(form.tip, 10);
    return isNaN(pct) ? 0 : subtotal * (pct / 100);
  })();

  const taxes = subtotal * 0.08875; // NYC blended rate
  const total = subtotal + deliveryFee + tipAmount + taxes;

  const set = useCallback((field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  function validateDetails(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
    if (!form.address.trim()) e.address = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.state.trim()) e.state = "Required";
    if (!form.zip.trim() || !/^\d{5}/.test(form.zip)) e.zip = "Valid ZIP required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validatePayment(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.cardName.trim()) e.cardName = "Required";
    if (!form.cardNumber.trim() || form.cardNumber.replace(/\D/g, "").length < 15) {
      e.cardNumber = "Valid card number required";
    }
    if (!form.cardExpiry.trim() || !/^\d{2}\/\d{2}$/.test(form.cardExpiry)) {
      e.cardExpiry = "MM/YY format";
    }
    if (!form.cardCvc.trim() || form.cardCvc.replace(/\D/g, "").length < 3) {
      e.cardCvc = "3–4 digits";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleDetailsNext() {
    if (validateDetails()) setStep("payment");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validatePayment()) return;

    setSubmitting(true);

    // Simulate processing delay (no real payment)
    await new Promise((r) => setTimeout(r, 1200));

    const orderId = generateOrderId();

    // Store order summary in sessionStorage for the confirmation page
    const orderData = {
      orderId,
      items: items.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        brand: i.product.brand,
        unit: i.product.unit,
        price: i.product.price,
        quantity: i.quantity,
        departmentIcon: i.department.icon,
        departmentSlug: i.department.slug,
      })),
      subtotal,
      deliveryFee,
      tipAmount,
      taxes,
      total,
      deliveryOption: form.deliveryOption,
      address: `${form.address}, ${form.city}, ${form.state} ${form.zip}`,
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      placedAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem(`order-${orderId}`, JSON.stringify(orderData));
    } catch {
      // Non-fatal — confirmation page handles missing data gracefully
    }

    clearCart();
    router.push(`/order/${orderId}`);
  }

  // Empty cart state
  if (items.length === 0 && !submitting) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Your cart is empty</h1>
          <p className="text-stone-500 text-sm mb-6">
            Add some items before checking out.
          </p>
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page header */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <nav className="text-xs text-stone-400 mb-2 flex items-center gap-1.5">
            <Link href="/" className="hover:text-emerald-600">Home</Link>
            <span>›</span>
            <span className="text-stone-600 font-medium">Checkout</span>
          </nav>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-stone-900">Checkout</h1>
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-sm">
              <span className={`font-semibold ${step === "details" ? "text-emerald-600" : "text-stone-400"}`}>
                1. Delivery
              </span>
              <span className="text-stone-300">→</span>
              <span className={`font-semibold ${step === "payment" ? "text-emerald-600" : "text-stone-400"}`}>
                2. Payment
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard ad — last impression before purchase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-center">
        <AdSlot size="leaderboard" placementId="checkout-top-leaderboard" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left column: form ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* STEP 1: Delivery details */}
            {step === "details" && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-6">Delivery Details</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="First name"
                    value={form.firstName}
                    onChange={(v) => set("firstName", v)}
                    error={errors.firstName}
                    placeholder="Jane"
                  />
                  <FormField
                    label="Last name"
                    value={form.lastName}
                    onChange={(v) => set("lastName", v)}
                    error={errors.lastName}
                    placeholder="Smith"
                  />
                  <FormField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => set("email", v)}
                    error={errors.email}
                    placeholder="jane@example.com"
                    className="sm:col-span-2"
                  />
                  <FormField
                    label="Phone"
                    type="tel"
                    value={form.phone}
                    onChange={(v) => set("phone", v)}
                    error={errors.phone}
                    placeholder="(555) 000-0000"
                    className="sm:col-span-2"
                  />
                  <FormField
                    label="Street address"
                    value={form.address}
                    onChange={(v) => set("address", v)}
                    error={errors.address}
                    placeholder="123 Main St, Apt 4B"
                    className="sm:col-span-2"
                  />
                  <FormField
                    label="City"
                    value={form.city}
                    onChange={(v) => set("city", v)}
                    error={errors.city}
                    placeholder="New York"
                  />
                  <div className="flex gap-3">
                    <FormField
                      label="State"
                      value={form.state}
                      onChange={(v) => set("state", v)}
                      error={errors.state}
                      placeholder="NY"
                      className="flex-1"
                    />
                    <FormField
                      label="ZIP"
                      value={form.zip}
                      onChange={(v) => set("zip", v)}
                      error={errors.zip}
                      placeholder="10001"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Delivery options */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-stone-700 mb-3">Delivery option</h3>
                  <div className="space-y-2">
                    {DELIVERY_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                          form.deliveryOption === opt.value
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="delivery"
                            value={opt.value}
                            checked={form.deliveryOption === opt.value}
                            onChange={() => set("deliveryOption", opt.value)}
                            className="accent-emerald-600"
                          />
                          <div>
                            <p className="text-sm font-semibold text-stone-800">{opt.label}</p>
                            <p className="text-xs text-stone-400">{opt.desc}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-stone-700">
                          {opt.price === 0 ? "Free" : formatPrice(opt.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDetailsNext}
                  className="mt-6 w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-sm"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === "payment" && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Back to delivery */}
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700"
                >
                  ← Back to delivery
                </button>

                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-stone-900 mb-2">Payment</h2>
                  <p className="text-xs text-stone-400 mb-5 flex items-center gap-1.5">
                    <span>🔒</span>
                    Demo only — no real payment is processed
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="Name on card"
                      value={form.cardName}
                      onChange={(v) => set("cardName", v)}
                      error={errors.cardName}
                      placeholder="Jane Smith"
                      className="sm:col-span-2"
                    />
                    <FormField
                      label="Card number"
                      value={form.cardNumber}
                      onChange={(v) => set("cardNumber", v.replace(/[^\d\s]/g, "").substring(0, 19))}
                      error={errors.cardNumber}
                      placeholder="4242 4242 4242 4242"
                      className="sm:col-span-2"
                    />
                    <FormField
                      label="Expiry"
                      value={form.cardExpiry}
                      onChange={(v) => set("cardExpiry", v)}
                      error={errors.cardExpiry}
                      placeholder="MM/YY"
                    />
                    <FormField
                      label="CVC"
                      value={form.cardCvc}
                      onChange={(v) => set("cardCvc", v.substring(0, 4))}
                      error={errors.cardCvc}
                      placeholder="123"
                    />
                  </div>
                </div>

                {/* Tip */}
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-stone-700 mb-3">
                    Tip your delivery driver
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {TIP_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => set("tip", opt)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                          form.tip === opt
                            ? "bg-emerald-600 text-white"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {opt === "custom" ? "Custom" : opt === "0" ? "No tip" : `${opt}%`}
                      </button>
                    ))}
                  </div>
                  {form.tip === "custom" && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-stone-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.50"
                        value={customTip}
                        onChange={(e) => setCustomTip(e.target.value)}
                        placeholder="0.00"
                        className="w-28 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  )}
                  {tipAmount > 0 && (
                    <p className="mt-2 text-xs text-stone-400">
                      Driver tip: {formatPrice(tipAmount)}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-emerald-600 text-white font-bold text-base rounded-xl hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Placing order…
                    </>
                  ) : (
                    `Place Order · ${formatPrice(total)}`
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ── Right column: order summary ────────────────────────────── */}
          <div className="lg:w-[380px] shrink-0">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm sticky top-24">
              <div className="p-5 border-b border-stone-100">
                <h2 className="text-base font-bold text-stone-900">
                  Order Summary
                  <span className="ml-2 text-sm font-normal text-stone-400">
                    ({items.reduce((a, i) => a + i.quantity, 0)} items)
                  </span>
                </h2>
              </div>

              {/* Items list */}
              <ul className="divide-y divide-stone-50 max-h-72 overflow-y-auto">
                {items.map(({ product, department, quantity }) => (
                  <li key={product.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-xl shrink-0">{department.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-700 truncate">{product.name}</p>
                      <p className="text-xs text-stone-400">{product.unit}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-stone-800">{formatPrice(product.price * quantity)}</p>
                      <div className="mt-0.5">
                        <QuantityControl productId={product.id} compact />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pricing breakdown */}
              <div className="p-5 space-y-2.5">
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Delivery fee</span>
                  <span>{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>Driver tip</span>
                    <span>{formatPrice(tipAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Estimated tax</span>
                  <span>{formatPrice(taxes)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-stone-900 pt-2 border-t border-stone-100">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Form field helper ────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  className?: string;
}

function FormField({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  className = "",
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-stone-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
          error
            ? "border-red-300 focus:ring-red-300 bg-red-50"
            : "border-stone-300 focus:ring-emerald-400 bg-white hover:border-stone-400"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
