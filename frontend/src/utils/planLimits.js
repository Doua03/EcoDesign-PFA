/**
 * Plan definitions and helpers.
 * The active plan is stored on the user object in localStorage (set at login
 * from the database). It cannot be changed from the browser — only the backend
 * controls it.
 */

export const PLANS = {
  free: {
    key: "free",
    name: "Plan Gratuit",
    maxProducts: 3,
    maxScenariosPerProduct: 2,
    recommendations: false,
    export: false,
  },
  pro: {
    key: "pro",
    name: "Plan Pro",
    maxProducts: Infinity,
    maxScenariosPerProduct: Infinity,
    recommendations: true,
    export: true,
  },
  enterprise: {
    key: "enterprise",
    name: "Plan Entreprise",
    maxProducts: Infinity,
    maxScenariosPerProduct: Infinity,
    recommendations: true,
    export: true,
  },
};

/** Returns the limits for the currently logged-in user's plan. */
export function getPlanLimits() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const key = user.plan || "free";
    return PLANS[key] || PLANS.free;
  } catch {
    return PLANS.free;
  }
}

/** Returns the current plan key ("free" | "pro" | "enterprise"). */
export function getCurrentPlanKey() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const key = user.plan || "free";
    return PLANS[key] ? key : "free";
  } catch {
    return "free";
  }
}
