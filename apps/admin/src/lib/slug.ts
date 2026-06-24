export function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}

type DeriveNextSlugStateInput = {
  name: string;
  currentSlug: string;
  hasManualOverride: boolean;
};

export function deriveNextSlugState(input: DeriveNextSlugStateInput) {
  const generated = createSlug(input.name);

  if (!input.currentSlug.trim()) {
    return {
      slug: generated,
      hasManualOverride: false,
    };
  }

  if (input.hasManualOverride) {
    return {
      slug: input.currentSlug,
      hasManualOverride: true,
    };
  }

  return {
    slug: generated,
    hasManualOverride: false,
  };
}
