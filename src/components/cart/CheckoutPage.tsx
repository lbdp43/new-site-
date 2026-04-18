import { useEffect, useMemo, useRef, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { ensureCartLoaded, formatMoney, setCart, useCart } from "../../lib/cart-store";
import { wc, type WcAddress } from "../../lib/woocommerce";

const STRIPE_KEY = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY as string | undefined;
/**
 * WooPayments utilise un compte Stripe Connect (Express). On doit donc passer
 * stripeAccount à Stripe.js pour que les PaymentMethod soient créés sur le bon
 * compte marchand. L'account ID est visible dans la réponse de
 * /wp-json/wc/v3/payments/accounts ("account_id").
 */
const STRIPE_ACCOUNT = import.meta.env.PUBLIC_STRIPE_ACCOUNT_ID as string | undefined;

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!STRIPE_KEY) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(
      STRIPE_KEY,
      STRIPE_ACCOUNT ? { stripeAccount: STRIPE_ACCOUNT } : undefined,
    );
  }
  return stripePromise;
}

const emptyAddress: WcAddress = {
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postcode: "",
  country: "FR",
  email: "",
  phone: "",
};

export default function CheckoutPage() {
  const { cart, initialized, itemCount, loading, minorUnit, currencySymbol } = useCart();

  useEffect(() => {
    ensureCartLoaded();
  }, []);

  const stripePromiseRef = useRef(getStripe());

  if (!initialized && loading) {
    return <div className="py-24 text-center text-ink-500">Chargement…</div>;
  }

  if (!STRIPE_KEY) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <h1 className="font-display text-3xl text-forest-900 mb-4">
          Paiement non configuré
        </h1>
        <p className="text-ink-700">
          La clé Stripe publique n'est pas renseignée (PUBLIC_STRIPE_PUBLISHABLE_KEY
          dans le fichier .env). Configure-la puis relance le serveur.
        </p>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-6 text-center">
        <h1 className="font-display text-3xl text-forest-900 mb-4">Panier vide</h1>
        <p className="text-ink-700 mb-6">Ajoute un produit avant de commander.</p>
        <a
          href="/boutique"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-forest-800 hover:bg-forest-900 text-cream-100 font-medium"
        >
          Retour à la boutique
        </a>
      </div>
    );
  }

  // On passe le cart total à Stripe Elements pour afficher le montant dans
  // les wallets (Apple Pay / Google Pay). Le vrai montant est re-calculé côté
  // WooCommerce au moment du /checkout.
  const amount = cart ? Math.round(Number(cart.totals.total_price)) : 0;
  const currency = (cart?.totals.currency_code ?? "EUR").toLowerCase();

  const options = {
    mode: "payment" as const,
    amount,
    currency,
    paymentMethodCreation: "manual" as const,
    // Restreint aux cartes : Apple Pay / Google Pay / Link restent car ce sont
    // des "wallets" adossés au type card. Klarna et Multibanco disparaissent.
    paymentMethodTypes: ["card"],
    appearance: {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "#0a6b43",
        colorBackground: "#ffffff",
        colorText: "#0b1a11",
        borderRadius: "12px",
        fontFamily: "system-ui, sans-serif",
      },
    },
  };

  return (
    <Elements stripe={stripePromiseRef.current} options={options}>
      <CheckoutInner />
    </Elements>
  );
}

function CheckoutInner() {
  const { cart, minorUnit, currencySymbol, updateCustomer, selectShippingRate } = useCart();
  const stripe = useStripe();
  const elements = useElements();

  const [billing, setBilling] = useState<WcAddress>({ ...emptyAddress });
  const [shippingSame, setShippingSame] = useState(true);
  const [shipping, setShipping] = useState<WcAddress>({ ...emptyAddress });
  const [customerNote, setCustomerNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveShipping = shippingSame ? billing : shipping;

  // Dès qu'on a un code postal + pays + ville, on demande à WC de calculer
  // les frais de port (debounce simple).
  const postcodeKey = `${effectiveShipping.country}|${effectiveShipping.postcode}|${effectiveShipping.city}`;
  useEffect(() => {
    const { country, postcode, city } = effectiveShipping;
    if (!country || !postcode || !city) return;
    const t = window.setTimeout(() => {
      updateCustomer({
        billing_address: billing,
        shipping_address: effectiveShipping,
      }).catch(() => {
        /* erreur dans state.error, on continue */
      });
    }, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcodeKey]);

  const shippingRates = cart?.shipping_rates?.[0]?.shipping_rates ?? [];
  const selectedRate = shippingRates.find((r) => r.selected)?.rate_id ?? shippingRates[0]?.rate_id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!stripe || !elements) {
      setFormError("Stripe n'est pas encore chargé. Réessaie dans un instant.");
      return;
    }
    if (!billing.email) {
      setFormError("L'adresse e-mail est obligatoire.");
      return;
    }

    setSubmitting(true);
    try {
      // Valide les champs Stripe avant toute requête.
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setFormError(submitError.message ?? "Vérifie tes informations de paiement.");
        return;
      }

      // Crée un PaymentMethod Stripe à partir des champs saisis.
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
        params: {
          billing_details: {
            name: `${billing.first_name} ${billing.last_name}`.trim(),
            email: billing.email,
            phone: billing.phone,
            address: {
              line1: billing.address_1,
              line2: billing.address_2 || undefined,
              city: billing.city,
              postal_code: billing.postcode,
              country: billing.country,
              state: billing.state || undefined,
            },
          },
        },
      });

      if (pmError || !paymentMethod) {
        setFormError(pmError?.message ?? "Erreur de paiement.");
        return;
      }

      // Envoie la commande à WooCommerce Store API.
      // Payload spécifique à WooPayments (et non au plugin Stripe Gateway) :
      //   payment_method = "woocommerce_payments"
      //   payment_data[] = { key: "wcpay-payment-method", value: "pm_xxx" }
      const result = await wc.checkout({
        billing_address: billing,
        shipping_address: effectiveShipping,
        customer_note: customerNote || undefined,
        payment_method: "woocommerce_payments",
        payment_data: [
          { key: "wcpay-payment-method", value: paymentMethod.id },
          { key: "wc-woocommerce_payments-new-payment-method", value: "false" },
        ],
      });

      const status = result.payment_result.payment_status;

      if (status === "success") {
        // Panier vidé côté serveur, on le vide côté client aussi.
        setCart(null);
        window.location.href = `/commande/confirmation?order=${result.order_id}&key=${encodeURIComponent(
          result.order_key,
        )}`;
        return;
      }

      // 3D Secure / action supplémentaire requise.
      const redirectUrl = result.payment_result.redirect_url;
      if (redirectUrl) {
        // Si WooCommerce renvoie un client_secret pour confirmation Stripe.js,
        // on aura besoin d'ajuster selon le vrai payload. Pour l'instant,
        // on redirige simplement vers l'URL fournie (pattern WC Stripe).
        window.location.href = redirectUrl;
        return;
      }

      setFormError("Le paiement a échoué. Vérifie tes informations ou réessaie.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de la commande.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-10">
        <Section title="Contact">
          <Input
            label="E-mail"
            type="email"
            required
            value={billing.email || ""}
            onChange={(v) => setBilling({ ...billing, email: v })}
          />
          <Input
            label="Téléphone"
            type="tel"
            value={billing.phone || ""}
            onChange={(v) => setBilling({ ...billing, phone: v })}
          />
        </Section>

        <Section title="Adresse de facturation">
          <AddressFields value={billing} onChange={setBilling} />
        </Section>

        <Section title="Adresse de livraison">
          <label className="inline-flex items-center gap-2 text-sm text-ink-700 mb-4">
            <input
              type="checkbox"
              checked={shippingSame}
              onChange={(e) => setShippingSame(e.target.checked)}
              className="rounded border-forest-300"
            />
            Livrer à la même adresse
          </label>
          {!shippingSame && <AddressFields value={shipping} onChange={setShipping} />}
        </Section>

        {shippingRates.length > 0 && (
          <Section title="Mode de livraison">
            <ul className="space-y-2">
              {shippingRates.map((r) => {
                const price = formatMoney(r.price, minorUnit, currencySymbol);
                const checked = r.rate_id === selectedRate;
                return (
                  <li key={r.rate_id}>
                    <label
                      className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                        checked
                          ? "border-forest-700 bg-forest-50"
                          : "border-forest-200 hover:border-forest-400"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping-rate"
                          checked={checked}
                          onChange={() => {
                            const pkgId = cart?.shipping_rates?.[0]?.package_id ?? 0;
                            selectShippingRate(pkgId, r.rate_id).catch(() => {});
                          }}
                          className="text-forest-700"
                        />
                        <span className="text-sm text-ink-800">{r.name}</span>
                      </span>
                      <span className="text-sm font-medium text-forest-900 tabular-nums">
                        {Number(r.price) === 0 ? "Offerte" : price}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        <Section title="Paiement">
          <PaymentElement options={{ layout: "tabs" }} />
          <p className="mt-3 text-xs text-ink-500">
            Paiement sécurisé par Stripe. Aucune donnée bancaire n'est stockée
            sur nos serveurs.
          </p>
        </Section>

        <Section title="Note à la commande (optionnel)">
          <textarea
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
            rows={3}
            placeholder="Cadeau, livraison en point relais, instructions…"
            className="w-full px-4 py-3 rounded-xl border border-forest-200 bg-white focus:outline-none focus:border-forest-600 text-sm"
          />
        </Section>

        {formError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            {formError}
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-28 self-start">
        <div className="rounded-2xl bg-cream-50 border border-forest-100 p-6 shadow-cream-lg">
          <h2 className="font-display text-xl text-forest-900 mb-5">Votre commande</h2>

          <ul className="divide-y divide-forest-100 mb-5">
            {cart?.items.map((it) => (
              <li key={it.key} className="py-3 flex items-start justify-between gap-3 text-sm">
                <div>
                  <div className="text-ink-800 font-medium">{it.name}</div>
                  {it.variation && it.variation.length > 0 && (
                    <div className="text-xs text-ink-500">
                      {it.variation.map((v) => v.value).join(" · ")}
                    </div>
                  )}
                  <div className="text-xs text-ink-500">Qté {it.quantity}</div>
                </div>
                <div className="tabular-nums text-ink-800">
                  {formatMoney(it.totals.line_total, minorUnit, currencySymbol)}
                </div>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 text-sm border-t border-forest-100 pt-4">
            <div className="flex justify-between text-ink-700">
              <dt>Sous-total</dt>
              <dd className="tabular-nums">
                {cart && formatMoney(cart.totals.total_items, minorUnit, currencySymbol)}
              </dd>
            </div>
            {cart && Number(cart.totals.total_shipping) > 0 && (
              <div className="flex justify-between text-ink-700">
                <dt>Livraison</dt>
                <dd className="tabular-nums">
                  {formatMoney(cart.totals.total_shipping, minorUnit, currencySymbol)}
                </dd>
              </div>
            )}
            {cart && Number(cart.totals.total_tax) > 0 && (
              <div className="flex justify-between text-ink-500">
                <dt>dont TVA</dt>
                <dd className="tabular-nums">
                  {formatMoney(cart.totals.total_tax, minorUnit, currencySymbol)}
                </dd>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-forest-100 text-forest-900 font-display text-xl">
              <dt>Total</dt>
              <dd className="tabular-nums">
                {cart && formatMoney(cart.totals.total_price, minorUnit, currencySymbol)}
              </dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={submitting || !stripe}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-forest-800 hover:bg-forest-900 text-cream-100 font-medium disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-cream-100/40 border-t-cream-100 animate-spin" />
                Traitement…
              </>
            ) : (
              <>
                Payer et commander
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </>
            )}
          </button>

          <p className="mt-3 text-xs text-ink-500 text-center">
            En validant, vous acceptez nos{" "}
            <a href="/cgv" className="underline">conditions générales de vente</a>.
          </p>
        </div>
      </aside>
    </form>
  );
}

// ---------- Champs formulaire ----------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl text-forest-900 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Input({
  label,
  type = "text",
  required,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-forest-600 font-medium mb-1.5">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 rounded-xl border border-forest-200 bg-white focus:outline-none focus:border-forest-600 text-sm"
      />
    </label>
  );
}

function AddressFields({ value, onChange }: { value: WcAddress; onChange: (v: WcAddress) => void }) {
  const set = (patch: Partial<WcAddress>) => onChange({ ...value, ...patch });
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Prénom"
          required
          value={value.first_name}
          onChange={(v) => set({ first_name: v })}
          autoComplete="given-name"
        />
        <Input
          label="Nom"
          required
          value={value.last_name}
          onChange={(v) => set({ last_name: v })}
          autoComplete="family-name"
        />
      </div>
      <Input
        label="Société (optionnel)"
        value={value.company}
        onChange={(v) => set({ company: v })}
        autoComplete="organization"
      />
      <Input
        label="Adresse"
        required
        value={value.address_1}
        onChange={(v) => set({ address_1: v })}
        autoComplete="address-line1"
      />
      <Input
        label="Complément d'adresse (optionnel)"
        value={value.address_2}
        onChange={(v) => set({ address_2: v })}
        autoComplete="address-line2"
      />
      <div className="grid sm:grid-cols-[120px_1fr] gap-4">
        <Input
          label="Code postal"
          required
          value={value.postcode}
          onChange={(v) => set({ postcode: v })}
          autoComplete="postal-code"
        />
        <Input
          label="Ville"
          required
          value={value.city}
          onChange={(v) => set({ city: v })}
          autoComplete="address-level2"
        />
      </div>
      <label className="block">
        <span className="block text-xs uppercase tracking-wider text-forest-600 font-medium mb-1.5">
          Pays <span className="text-red-600">*</span>
        </span>
        <select
          required
          value={value.country}
          onChange={(e) => set({ country: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-forest-200 bg-white focus:outline-none focus:border-forest-600 text-sm"
        >
          <option value="FR">France</option>
          <option value="BE">Belgique</option>
          <option value="CH">Suisse</option>
          <option value="LU">Luxembourg</option>
          <option value="DE">Allemagne</option>
          <option value="IT">Italie</option>
          <option value="ES">Espagne</option>
          <option value="NL">Pays-Bas</option>
        </select>
      </label>
    </>
  );
}
