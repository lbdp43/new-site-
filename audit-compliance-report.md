# Audit de conformité RGPD / légale / réglementaire — La Brasserie des Plantes

**Site audité** : https://test.labrasseriedesplantes.fr
**Date** : 2026-04-27
**Périmètre** : Vente d'alcool en ligne France + UE, e-commerce headless Astro + WooCommerce, paiement WooPayments (Stripe)
**Auditeur** : Claude (session automatisée)

---

## Synthèse exécutive

Le site est **globalement bien charpenté côté Loi Évin** (AgeGate fonctionnel, mention "L'abus d'alcool…" dans le footer + AgeGate + page de confirmation), mais présente **trois problèmes bloquants pour la bascule www.** :

1. **Aucun bandeau de consentement cookies (RGPD/CNIL)** — la page `/politique-cookies` annonce un bouton "Préférences cookies" en pied de page qui n'existe pas. Note : aucun script tiers (GA, Meta Pixel) n'est actuellement chargé sur le live, donc le risque immédiat est limité, mais l'infraction documentaire est réelle dès que le moindre cookie non strictement nécessaire est posé.
2. **Mentions légales incomplètes et erronées** — hébergeur déclaré = Netlify, alors que l'infrastructure tourne sur **Vercel** (entête `server: Vercel`). Manquent aussi : forme juridique, capital social, RCS, numéro TVA intracommunautaire, ville du RCS, statut "EI / SAS / micro-entrepreneur".
3. **Faux avis clients en page produit** — `src/data/reviews.ts` contient 17 avis avec "noms d'emprunt" et un badge `verified: true`. Cette pratique constitue une **pratique commerciale trompeuse** (Code de la consommation L. 121-2 + directive Omnibus 2022) et expose à une amende DGCCRF jusqu'à **300 000 €** (ou 10 % du CA HT). Aggravant : le commit `reviews.ts:2` documente explicitement le caractère factice.

Les CGV sont solides, conformes et complètes. La Loi Évin est respectée sur l'essentiel. Le pictogramme femme enceinte est manquant sur les visuels produit (recommandation forte INPES — non sanctionné mais reste exposé en cas de contrôle ARS / DGCCRF).

---

## Scores par catégorie

| Catégorie | Score / 100 | Statut |
|---|---|---|
| RGPD / Privacy | **48** | 🔴 Bloquant |
| Mentions légales | **55** | 🔴 Bloquant |
| CGV | **88** | 🟢 Bon |
| Réglementation alcool (Loi Évin) | **78** | 🟡 Acceptable, à améliorer |
| Vente en ligne UE (Omnibus, TVA, faux avis) | **42** | 🔴 Bloquant |
| Accessibilité (WCAG 2.1 AA) | **62** | 🟡 Acceptable, à améliorer |

**Note globale pondérée : 62/100** (avec coefficient bloquant sur les 3 points rouges).

---

## 1. RGPD / Privacy — 48/100

### ✅ Ce qui est OK

- Page `/politique-cookies` détaillée (FR + EN), liste 4 cookies (`lbdp_age_gate`, `lbdp_cart`, `_ga*`, `fbp`) avec finalité / durée / consentement requis ou non.
- Page mentions légales contient une section RGPD avec mention CNIL et droit d'accès / rectification / suppression / portabilité / opposition.
- DPO/contact = `labrasseriedesplantes@gmail.com` (le même que l'email général — acceptable pour une TPE).
- Mention Do Not Track respectée (sur le papier, à vérifier en runtime).
- Mention SCC pour transferts hors UE.
- **Aucun script tiers (GA4, Meta Pixel, Hotjar, etc.) n'est actuellement chargé sur le live** — vérifié via inspection de `/tmp/lbdp_home.html` : aucune occurrence de `gtag.js`, `googletagmanager`, `fbevents`, `connect.facebook`, `hotjar`, etc.
- Formulaire de contact (`src/pages/contact.astro:175-178`) : phrase "En soumettant ce formulaire, vous acceptez que vos données soient traitées pour répondre à votre demande." (acceptable en base légale "exécution précontractuelle / intérêt légitime" pour un formulaire contact).

### 🔴 Bloquants

- **Aucun bandeau de consentement cookies opt-in granulaire**. Vérifié :
  - `grep -rn cookieconsent|tarteaucitron|axeptio|didomi|onetrust|cookiebot src/` → aucun résultat.
  - Inspection HTML live → aucune trace de banner/modal/widget de consentement.
  - La page `/politique-cookies` mentionne pourtant : "Modifier votre choix via le bouton **« Préférences cookies »** en pied de page" — ce bouton **n'existe pas** dans `src/components/Footer.astro`. Mention trompeuse vis-à-vis de l'utilisateur.
  - Lignes 30–43 de `src/pages/politique-cookies.astro` annoncent que `_ga` et `fbp` peuvent être actifs "avec consentement" — mais comme il n'y a pas de mécanisme de recueil, dès qu'un script tiers sera ajouté il sera déposé sans consentement → infraction CNIL.
  - **Conséquence immédiate** : sanction CNIL possible dès le premier cookie non essentiel (recommandation CNIL 2021 : amende administrative jusqu'à 20 M€ ou 4 % du CA mondial).
  - **Délibération CNIL 2020-091** : "Refuser" doit être aussi visible que "Accepter", avec niveau de granularité (catégories : nécessaires / mesure d'audience / marketing / réseaux sociaux).
- **Pas de page dédiée "Politique de confidentialité"** distincte des mentions légales. La section RGPD intégrée aux mentions légales est minimaliste et omet :
  - La liste nominative des **sous-traitants** (Vercel — hébergement, Stripe / WooPayments — paiement, WordPress hébergeur du back-office, Netlify Forms — formulaire contact, Featurable — widget avis).
  - Les **durées de conservation** précises par finalité (commande, comptabilité, prospection, contact).
  - Les **bases légales** (exécution du contrat / obligation légale / intérêt légitime / consentement) finalité par finalité.
  - Les **transferts hors UE** détaillés (Stripe = US, Vercel = peut-être US/Singapour selon edge, WooPayments = US).
  - Le droit d'introduire une réclamation auprès de la CNIL (mentionné mais sans lien direct https://www.cnil.fr/fr/plaintes).

### 🟡 Importants

- L'email DPO `labrasseriedesplantes@gmail.com` est un **Gmail** : risque RGPD car les communications RGPD officielles transitent par les serveurs Google US. Recommandation : adresse `dpo@labrasseriedesplantes.fr` ou équivalent sur infrastructure FR/UE.
- Pas de mention du cookie panier WooCommerce (`Cart-Token` JWT stocké en localStorage). Documenter dans la liste cookies.
- Pas de mention de la collecte d'IP / fingerprinting éventuel par Stripe Radar (anti-fraude).

### Action recommandée

1. **Installer un consent management** type Klaro!, Tarteaucitron, ou Orejime (auto-hébergés, légers, conformes CNIL). Évite Cookiebot/OneTrust (lourds, payants, US).
2. Créer **`/politique-confidentialite`** distincte de `/mentions-legales` avec la liste exhaustive des sous-traitants et durées de conservation.
3. Ajouter le bouton "Préférences cookies" effectif dans le footer (ré-ouvrir le banner).

---

## 2. Mentions légales — 55/100

### ✅ Ce qui est OK

- Nom commercial : "La Brasserie des Plantes"
- SIRET : `89920152900018` (14 chiffres, structure valide ; SIREN = 899 201 529)
- Adresse : 18 Grand Place, 43140 Saint-Didier-en-Velay, France
- Téléphone : 09 74 97 41 01
- Email : labrasseriedesplantes@gmail.com
- Directeur de la publication : Étienne Darinot, cofondateur
- Mention CNIL + DPO + droits RGPD
- Section "Vente d'alcool — mention obligatoire" avec rappel L. 3342-1 et "L'abus d'alcool…"
- Loi applicable + juridiction (Puy-en-Velay)

### 🔴 Bloquants

- **Hébergeur déclaré erroné** : `src/pages/mentions-legales.astro:42-47` indique **Netlify, Inc.** (San Francisco). L'inspection des entêtes HTTP du live révèle `server: Vercel` + `x-vercel-cache: HIT`. **Le site tourne sur Vercel**, pas Netlify. Mention obligatoire LCEN art. 6 III, sanction = 75 000 € d'amende + 1 an d'emprisonnement (peine théorique mais inscrite au code). À corriger : Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA — `https://vercel.com`.
- **Forme juridique manquante**. Aucune mention "EI" / "EURL" / "SAS" / "SASU" / "SARL" / "micro-entrepreneur" / "auto-entrepreneur". Le SIRET 899 201 529 est très probablement une **EI** (Entreprise Individuelle) au regard du caractère artisanal et du fait que le nom commercial est utilisé directement, mais à confirmer auprès du gérant. À expliciter.
- **Capital social** : doit être déclaré pour toute société commerciale (SARL, SAS, etc.). Si EI ou micro-entrepreneur → pas de capital, mais alors le mentionner explicitement ("Entreprise individuelle, capital non applicable").
- **RCS / RM** : doit indiquer la ville d'immatriculation au Registre du Commerce et des Sociétés (ex : "RCS Le Puy-en-Velay 899 201 529") ou au Répertoire des Métiers selon statut. Manquant.
- **Numéro de TVA intracommunautaire** : obligatoire dès lors que l'entreprise vend en UE (Belgique, Suisse, Luxembourg sont mentionnés en CGV). Format : `FR XX 899 201 529`. Manquant.

### 🟡 Importants

- Pas de mention du **médiateur de la consommation** (présent en CGV mais devrait aussi être dans les ML, surtout pour la conformité art. L. 616-1 Code de la conso).
- Pas de mention de la **plateforme RLL UE** (https://ec.europa.eu/consumers/odr/) — obligatoire art. 14 règlement 524/2013 pour vendeurs en ligne UE.
- Pas de licence/agrément spécifique à la vente d'alcool : si l'établissement détient une **licence à emporter** (obligatoire pour vente d'alcool), elle pourrait être mentionnée pour transparence (recommandation, non obligatoire en e-commerce pur).
- Section "Données personnelles" devrait pointer vers une page dédiée `/politique-confidentialite` plutôt que tout regrouper dans les ML.
- Adresse mail Gmail pour contact officiel (cf. § RGPD).

---

## 3. CGV — 88/100

### ✅ Ce qui est OK (très bonne base)

- Identification du vendeur (nom, SIRET, adresse) — § 1.
- Description des produits — § 2.
- **Interdiction vente aux mineurs** L. 3342-1 — § 3 (avec déclaration sur l'honneur de majorité au moment de la commande).
- Validation commande + email confirmation — § 4.
- Prix TTC en euros, frais de port à part, livraison gratuite ≥ 65 € — § 5.
- Paiement sécurisé SSL, moyens listés (CB, Apple Pay, Google Pay, PayPal, SEPA) — § 6.
- Livraison : délai 2-3 jours ouvrés + 48-72h Colissimo, FR + Belgique + Suisse + Luxembourg, gestion casse transporteur — § 7.
- **Droit de rétractation 14 jours** L. 221-18 + procédure claire — § 8. ✅ Conforme directive 2011/83/UE.
- **Garanties légales** L. 217-4 + vices cachés art. 1641 — § 9. ✅
- Service client + délai 48h ouvrées — § 10.
- **Médiation conso** : CNPM-Médiation Consommation — § 11. ✅
- Propriété intellectuelle — § 12.
- Renvoi RGPD — § 13.
- **Loi française + tribunaux Puy-en-Velay** — § 14. ✅

### 🟡 Importants à compléter

- **Plateforme RLL UE manquante** : ajouter "Conformément au règlement UE 524/2013, la Commission européenne met à disposition une plateforme de règlement en ligne des litiges accessible à : https://ec.europa.eu/consumers/odr/" (obligation contractuelle vendeur en ligne UE B2C).
- **Formulaire type de rétractation** : l'annexe 1 de l'art. R. 221-1 du Code de la conso impose qu'un formulaire-type de rétractation soit fourni. La procédure email actuelle est OK mais le formulaire-type renforce la conformité.
- **TVA intracommunautaire / OSS** : aucune mention du régime TVA cross-border. Pour livraisons UE > 10 000 €/an cumulés → obligation guichet unique OSS et TVA pays acheteur. À documenter en CGV § 5 ou clause spécifique.
- **§ 8 alinéa 2** : "Les produits descellés, ouverts ou détériorés ne peuvent être repris pour raisons sanitaires" — formulation OK mais devrait citer **art. L. 221-28 5°** (exception au droit de rétractation pour biens descellés non retournables pour raisons d'hygiène ou de protection de la santé). Le simple fait de l'expliciter sécurise juridiquement.
- **Politique d'annulation côté vendeur** : "Nous nous réservons le droit d'annuler toute commande présentant une anomalie manifeste" — formulation un peu floue, à border (motifs précis : suspicion de fraude, rupture de stock, adresse invalide).
- **Restrictions de livraison** : pas de limite de quantité par commande pour les spiritueux. Recommandation : ajouter une clause type "au-delà de X bouteilles, contactez-nous" pour limiter le risque fraude / revente / mineurs.

### Action recommandée

Ajouter un § 15 "Plateforme européenne RLL" et un § 16 "TVA intracommunautaire" pour atteindre 95/100.

---

## 4. Réglementation alcool (Loi Évin / Code santé publique) — 78/100

### ✅ Ce qui est OK

- **AgeGate fonctionnel** (`src/components/AgeGate.astro`) : modal plein écran au premier chargement, demande "Avez-vous l'âge légal pour consommer ?", boutons "Oui, j'ai 18 ans ou plus" / "Non, je suis mineur(e)" → redirection vers https://www.alcool-info-service.fr/. Stockage `localStorage` 30 jours. ✅ Conforme L. 3342-1.
- **Mention "L'abus d'alcool est dangereux pour la santé. À consommer avec modération."** présente :
  - Dans la modale AgeGate (en pied de modale).
  - Dans le footer global de toutes les pages (vérifié sur `/`, `/boutique`, `/boutique/alchimie-vegetale`, `/cgv`, `/mentions-legales`).
  - Dans `/mentions-legales` (encart dédié).
  - Dans `/cgv` § 3.
  - Sur la page de confirmation de commande (`src/pages/commande/confirmation.astro:58`).
- L'i18n EN traduit correctement par "Excessive alcohol consumption is harmful to health. Please drink responsibly." (`src/i18n/ui.ts:181`).
- Texte exact conforme à l'**arrêté du 2 octobre 2006** (formulation officielle).
- Pas de claim allégations santé / thérapeutique. Le seul passage à risque (`liqueurs-de-plantes.astro:29`) **désamorce explicitement** : "L'alcool reste de l'alcool — à consommer avec modération. […] Nous ne formulons aucune allégation thérapeutique." ✅
- Volume d'alcool affiché sur la fiche produit (`50% vol`).

### 🟡 Améliorations recommandées

- **Pictogramme femme enceinte (logo grossesse) absent sur les visuels produit**. Recommandation INPES depuis 2007 (décret 2006-1380) : le pictogramme officiel devrait figurer sur les **étiquettes physiques des bouteilles**. Sur le **site web**, ce n'est pas une obligation légale stricte (la loi vise l'emballage), mais c'est une **bonne pratique** et certains contrôles ARS/DGCCRF peuvent reprocher l'omission au vu de la sensibilité du sujet.
  - Action : intégrer le pictogramme officiel à proximité de la mention Évin sur les fiches produit + ajouter une ligne texte "La consommation de boissons alcoolisées pendant la grossesse, même en faible quantité, peut avoir des conséquences graves sur la santé de l'enfant."
- **Prominence de la mention Évin en footer** : actuellement en `text-cream-200/60` (≈60 % d'opacité crème sur fond `forest-900` très sombre). Le contraste WCAG est probablement insuffisant (≈ 3:1, à valider). La recommandation Évin n'impose pas de taille/contraste minimum mais la **CSA / Bureau Vérification Publicité** demande une visibilité "claire et lisible". Le doubler en opacité (`text-cream-200/90`) ou utiliser `text-cream-100` règle le problème.
- **Mention Évin n'apparaît pas dans la barre promo de tête** (qui annonce "Livraison offerte dès 65 €"). Bonne pratique sur les sites concurrents : afficher la mention en headband haut de page également.
- **Pas de communication sur les volumes maximaux par commande** : la loi Évin ne fixe pas de quantité max, mais en cas de commande inhabituelle (ex : 50 bouteilles), un contrôle d'identité ou un alerte fraude serait pertinent. À documenter dans une procédure interne plutôt qu'en CGV.
- **Loi Évin et publicité indirecte** : la communication marketing du site (pages ateliers, blog, plantes) reste sobre, sans incitation directe à la consommation. ✅
- **Sponsoring sportif / culturel** : si LBDP en fait, vérifier le respect de la loi Évin (interdiction publicité alcool dans manifestations sportives). Hors périmètre site.

### 🟢 Bonus

- L'AgeGate redirige les mineurs vers le site officiel **Alcool Info Service** (https://www.alcool-info-service.fr/) — c'est une excellente pratique, peu courante, qui montre une démarche responsable.

---

## 5. Vente en ligne UE — 42/100 🔴

### 🔴 Bloquants

- **FAUX AVIS CLIENTS** sur les fiches produit (`src/data/reviews.ts`).
  - 17 avis avec "noms d'emprunt" (commentaire ligne 2 du fichier : *"Avis clients — basés sur des retours récoltés (bouche-à-oreille, salons, cavistes). Noms d'emprunt, localités réelles. Tous les contenus sont réalistes et non génériques."*).
  - 11 sur 17 portent un badge `verified: true`.
  - Affichés sur les fiches produit via `<ReviewsSection>` (`src/pages/boutique/[slug].astro:677-679`).
  - Composant `ReviewsSection.astro` affiche un libellé "Avis clients" + badge "vérifié" → **induction explicite en erreur** sur la nature réelle des avis.
  - **Infractions cumulables** :
    - **Directive Omnibus 2022 / art. L. 121-2 Code de la conso** : pratique commerciale trompeuse → amende DGCCRF jusqu'à 300 000 € ou 10 % du CA HT, prison 2 ans (art. L. 132-2).
    - **Norme NF Z74-501** sur les avis en ligne : si on prétend "vérifier" sans procédure de vérification, on est en infraction.
    - **Politique Google Search** : faux avis clients = pénalité manuelle, désindexation possible.
    - **Risque de signalement DGCCRF par un concurrent** (procédure simple, gratuite via SignalConso).
  - **Aggravant** : le commentaire dans le code source (ligne 1-3 de `reviews.ts`) **documente explicitement** la falsification, ce qui rend toute défense de bonne foi impossible.
  - **Action immédiate** :
    1. Retirer purement et simplement la section "Avis clients" interne sur fiches produit, OU
    2. La remplacer intégralement par les vrais avis Google (déjà câblés via Featurable widget `72bbcee7-7505-40ea-add0-e4071e80db1b` côté homepage), OU
    3. Recueillir de vrais avis post-achat (Avis Vérifiés, Trustpilot, ou natif WooCommerce avec vérif commande).
    4. Renommer le fichier `src/data/reviews.ts` ou ajouter un `.gitignore` ne suffira PAS — il faut le supprimer du repo et de l'historique git si possible (`git filter-repo`).

### 🟡 Importants

- **Directive Omnibus 2022 — prix barrés** : aucun prix barré n'a été détecté en live (vérifié par grep "prix barré|prix initial|30 derniers jours"). Pas de promo en cours visiblement. Si une promo est mise en place plus tard, **obligation d'afficher le prix le plus bas pratiqué les 30 derniers jours** comme prix de référence (art. L. 112-1-1 Code conso). À documenter dans une checklist marketing.
- **TVA intracommunautaire** : le site livre en France métropolitaine, Belgique, Suisse, Luxembourg. La Suisse étant hors UE → règles douanières spécifiques (T1, dédouanement, accise alcool). Belgique et Luxembourg sont en UE → régime OSS si CA cross-border > 10 000 €/an cumulés. Aucune mention de la gestion de l'accise sur l'alcool (DAC1 / DAA / DSA pour expéditions UE de produits soumis à accise). ⚠️ La vente d'alcool en distance UE→UE relève d'un régime **très spécifique** (art. 32 directive 2008/118/CE) qui peut imposer la **représentation fiscale dans l'État de destination** + paiement de l'accise locale. À faire vérifier par un expert-comptable dès que les volumes UE deviennent significatifs.
- **Origine des avis Google via Featurable** : non documentée explicitement (qui est Featurable, où sont stockées les données, transfert hors UE ?). À ajouter dans `/politique-confidentialite`.

### Action recommandée

**SUPPRESSION IMMÉDIATE** des faux avis avant la bascule www. L'enjeu pénal est concret et un signalement DGCCRF aboutit en 6-12 mois.

---

## 6. Accessibilité (WCAG 2.1 AA) — 62/100

### ✅ Ce qui est OK

- `<html lang="fr">` correctement défini (ou `lang="en"` sur les pages /en/).
- 90 attributs `alt` présents sur les `<img>` (zéro `<img>` sans alt sur la home).
- 25 `aria-label` répartis (boutons icônes, liens icônes, panier, etc.).
- 5 `<label>` sur le formulaire contact.
- Les boutons de navigation et menu mobile semblent avoir des labels explicites (`aria-label="Panier vide"` etc.).
- Modale AgeGate correctement configurée : `role="dialog"`, `aria-modal="true"`, `aria-labelledby="age-gate-title"` ✅.

### 🟡 Améliorations

- **Aucun lien "Skip to content" / "Aller au contenu"** détecté en début de `<body>`. WCAG 2.4.1 *Contournement de blocs* (niveau A). Ajouter un `<a href="#main" class="sr-only focus:not-sr-only">Aller au contenu</a>` en début de body.
- **Contraste à vérifier** :
  - `text-cream-200/60` sur `bg-forest-900` (footer) — ratio probablement < 4.5:1 (échec WCAG AA pour texte normal). À calculer/corriger.
  - `text-[11px] text-ink-500` sur l'AgeGate pour la mention Évin — la taille 11px est sous la recommandation WCAG (≥ 12px pour confort, 14px+ pour normaltext).
- **Navigation clavier** : non vérifiée en runtime (script automatisé requis : axe-core, Lighthouse). Risque sur le mini-cart drawer, l'AgeGate (focus trap), le menu mobile.
- **Préchargement des polices** sans `font-display: swap` documenté → risque FOUT/FOIT (cosmétique mais impacte CLS/LCP, indirectement WCAG).
- **Champ formulaire `type="email"`** sans `aria-describedby` ni `aria-invalid` géré → l'erreur de saisie ne sera pas annoncée aux lecteurs d'écran.
- **Messages d'erreur de paiement** (CheckoutPage.tsx) : à vérifier qu'ils ont `role="alert"` ou `aria-live="polite"`.

### Action recommandée

Lancer un audit Lighthouse + axe-core sur les pages clés (home, fiche produit, panier, checkout) et corriger les violations niveau AA. Utile : le Référentiel Général d'Amélioration de l'Accessibilité (RGAA 4.1) bien que non obligatoire pour un site privé < 250 M€ CA.

---

## Issues bloquantes pour la bascule www.

1. **🔴 [RGPD] Aucun bandeau de consentement cookies fonctionnel** — installer Klaro!/Tarteaucitron/Orejime + créer un bouton "Préférences cookies" effectif dans le footer. Sinon, dès qu'un script tiers (GA4, Meta Pixel, Featurable, embed YouTube, fonts Google externes) est ajouté → infraction CNIL immédiate.
2. **🔴 [Mentions légales] Hébergeur erroné** — remplacer Netlify par Vercel Inc. (440 N Barranca Avenue #4133, Covina, CA 91723, USA). LCEN art. 6 III.
3. **🔴 [Mentions légales] Forme juridique + RCS + capital + TVA intra manquants** — ajouter "Entreprise individuelle" (ou autre selon Kbis) + RCS Le Puy-en-Velay 899 201 529 + numéro TVA intracom.
4. **🔴 [Vente UE / Concurrence loyale] Faux avis clients** — supprimer immédiatement le composant `<ReviewsSection>` des fiches produit ou remplacer par le widget Featurable (vrais avis Google). Le code source documente explicitement la falsification ("noms d'emprunt") → risque DGCCRF concret.

## Issues importantes mais non bloquantes

- **[RGPD]** Créer une page `/politique-confidentialite` distincte avec liste sous-traitants (Vercel, Stripe, WooPayments, Featurable, Netlify Forms, WordPress) + durées conservation par finalité + bases légales + lien plainte CNIL.
- **[RGPD]** Migrer l'email DPO vers une adresse pro (`dpo@labrasseriedesplantes.fr`) et non Gmail.
- **[CGV]** Ajouter un § plateforme RLL UE (https://ec.europa.eu/consumers/odr/) — obligation art. 14 règlement 524/2013.
- **[CGV]** Ajouter formulaire-type de rétractation (annexe 1 art. R. 221-1).
- **[CGV]** Documenter régime TVA / OSS / accise alcool pour expéditions UE.
- **[Loi Évin]** Ajouter le pictogramme officiel femme enceinte sur fiches produit (recommandation INPES).
- **[Loi Évin]** Augmenter le contraste de la mention Évin en footer (`text-cream-200/60` → `text-cream-200/90`).
- **[Accessibilité]** Ajouter un lien "Aller au contenu" + auditer le contraste WCAG AA.

## Issues bonus / amélioration continue

- **[RGPD]** Documenter le cookie panier WooCommerce (`Cart-Token` JWT) dans la liste cookies.
- **[Loi Évin]** Mention Évin dans la barre promo haute (en plus du footer).
- **[CGV]** Limiter les quantités max par commande pour limiter les fraudes.
- **[A11y]** Audit Lighthouse + axe-core complet, focus management modale AgeGate.
- **[A11y]** RGAA 4.1 — pas obligatoire mais pédagogique.

---

## Recommandation finale go / no-go

### 🔴 NO-GO bascule www. en l'état.

**Trois corrections critiques sont à apporter avant bascule** :

1. **Supprimer les faux avis** (`src/data/reviews.ts` + composant `<ReviewsSection>` des fiches produit, ou remplacer par Featurable). **Estimation : 2-3 h de dev.** Risque pénal concret + amende DGCCRF jusqu'à 300 K€.

2. **Installer un consent management cookies** (Klaro! recommandé : MIT, léger, FR/UE-friendly). **Estimation : 4-6 h de dev** (intégration + bouton footer + mapping aux cookies déclarés).

3. **Compléter les mentions légales** (hébergeur Vercel, forme juridique, RCS, capital, TVA intra, médiateur, plateforme RLL). **Estimation : 1-2 h** (rédaction + vérification info juridique avec le gérant).

**Total : ~1 jour-homme de dev + vérifications juridiques.**

Une fois ces 3 points corrigés, le site peut basculer en `www.` avec un score global remonté à **~85/100**, niveau acceptable pour une TPE artisanale.

### Recommandations post-bascule (à intégrer à `docs/bascule-www.md`)

- Page `/politique-confidentialite` dédiée + email DPO pro.
- Pictogramme grossesse sur fiches produit.
- Plateforme RLL + formulaire-type rétractation en CGV.
- Lien "Aller au contenu" + audit a11y Lighthouse.
- Documentation interne du régime TVA UE / OSS / accise alcool.

---

*Audit réalisé en mode automatisé par exploration du code source (`src/pages/*.astro`, `src/components/*.astro`, `src/data/*.ts`) et inspection HTML du live (https://test.labrasseriedesplantes.fr). Pour une validation juridique formelle, faire relire ce rapport par un avocat spécialisé en droit de la consommation et en droit numérique avant la bascule.*
