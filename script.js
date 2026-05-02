const CONFIG = window.PRODUCT_CONFIG || {};

const SELECTORS = {
  checkoutLinks: ".js-checkout-link",
  scrollLinks: ".js-scroll-link",
  coverImages: ".js-cover-image",
  privacyLink: ".js-privacy-link",
  termsLink: ".js-terms-link",
  leadForm: "#lead-form",
  formStatus: "#form-status",
};

function initMetaPixel() {
  if (!window.fbq || !CONFIG.metaPixelId || CONFIG.metaPixelId === "PIXEL_ID_AQUI") return;
  window.fbq("init", CONFIG.metaPixelId);
  window.fbq("track", "PageView");
}

function bindCheckoutLinks() {
  document.querySelectorAll(SELECTORS.checkoutLinks).forEach((link) => {
    link.setAttribute("href", CONFIG.hotmartUrl || "https://pay.hotmart.com/K104704802N");
    link.addEventListener("click", () => {
      if (window.fbq) {
        window.fbq("track", "InitiateCheckout");
      }
    });
  });
}

function bindScrollLinks() {
  document.querySelectorAll(SELECTORS.scrollLinks).forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || !targetId.startsWith("#")) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function applyAssetConfig() {
  document.querySelectorAll(SELECTORS.coverImages).forEach((image) => {
    image.src = CONFIG.coverImagePath || "assets/vacuo-cover.png";
  });

  const privacy = document.querySelector(SELECTORS.privacyLink);
  const terms = document.querySelector(SELECTORS.termsLink);
  if (privacy) privacy.href = CONFIG.privacyPolicyUrl || "#politica-de-privacidade";
  if (terms) terms.href = CONFIG.termsUrl || "#termos-de-uso";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateWhatsapp(whatsapp) {
  if (!whatsapp.trim()) return true;
  const digits = whatsapp.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

function setError(fieldName, message) {
  const node = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (node) node.textContent = message;
}

function clearErrors() {
  document.querySelectorAll(".error-message").forEach((node) => {
    node.textContent = "";
  });
}

async function handleLeadSubmit(event) {
  event.preventDefault();
  clearErrors();

  const form = event.currentTarget;
  const status = document.querySelector(SELECTORS.formStatus);
  const data = new FormData(form);

  const payload = {
    name: String(data.get("name") || "").trim(),
    email: String(data.get("email") || "").trim(),
    whatsapp: String(data.get("whatsapp") || "").trim(),
    consent: data.get("consent") === "on",
  };

  let hasErrors = false;

  if (!payload.name) {
    setError("name", "Seu nome é obrigatório.");
    hasErrors = true;
  }

  if (!payload.email) {
    setError("email", "Seu email é obrigatório.");
    hasErrors = true;
  } else if (!validateEmail(payload.email)) {
    setError("email", "Digite um email válido.");
    hasErrors = true;
  }

  if (!validateWhatsapp(payload.whatsapp)) {
    setError("whatsapp", "Digite um WhatsApp válido ou deixe em branco.");
    hasErrors = true;
  }

  if (!payload.consent) {
    setError("consent", "Você precisa concordar para receber as mensagens.");
    hasErrors = true;
  }

  if (hasErrors) {
    if (status) status.textContent = "Confere os campos e tenta de novo.";
    return;
  }

  if (status) status.textContent = "Enviando...";

  try {
    const response = await fetch(CONFIG.leadEndpoint || "/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Lead request failed");
    }

    if (window.fbq) {
      window.fbq("track", "Lead");
    }

    form.reset();
    if (status) status.textContent = "Pronto. As mensagens grátis vão chegar no contato informado.";
  } catch (error) {
    if (status) {
      status.textContent = "Não deu pra enviar agora. Tenta de novo em instantes.";
    }
  }
}

function bindLeadForm() {
  const form = document.querySelector(SELECTORS.leadForm);
  if (!form) return;
  form.addEventListener("submit", handleLeadSubmit);
}

document.addEventListener("DOMContentLoaded", () => {
  initMetaPixel();
  applyAssetConfig();
  bindCheckoutLinks();
  bindScrollLinks();
  bindLeadForm();
});
