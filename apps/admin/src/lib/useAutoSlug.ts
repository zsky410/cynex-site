import { Form } from "antd";
import type { FormInstance } from "antd/es/form";
import { useCallback, useEffect, useState } from "react";
import { createSlug, deriveNextSlugState } from "./slug";

type NamedRecord = {
  name?: string | null;
  slug?: string | null;
};

export function useAutoSlug<T extends NamedRecord>(form: FormInstance<T>) {
  const unsafeForm = form as FormInstance<Record<string, unknown>>;
  const [hasManualOverride, setHasManualOverride] = useState(false);
  const name = Form.useWatch("name", form);

  useEffect(() => {
    const currentName = String(name ?? "");
    const currentSlug = String(unsafeForm.getFieldValue("slug") ?? "");
    const next = deriveNextSlugState({
      name: currentName,
      currentSlug,
      hasManualOverride,
    });

    if (next.slug !== currentSlug) {
      unsafeForm.setFieldValue("slug", next.slug);
    }

    if (next.hasManualOverride !== hasManualOverride) {
      setHasManualOverride(next.hasManualOverride);
    }
  }, [form, hasManualOverride, name]);

  const syncAutoSlugState = useCallback((values?: NamedRecord | null) => {
    const nextName = String(values?.name ?? "");
    const nextSlug = String(values?.slug ?? "");
    setHasManualOverride(Boolean(nextSlug.trim()) && nextSlug !== createSlug(nextName));
  }, []);

  const handleSlugChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextSlug = event.target.value;
      const generated = createSlug(String(unsafeForm.getFieldValue("name") ?? ""));
      setHasManualOverride(Boolean(nextSlug.trim()) && nextSlug !== generated);
    },
    [unsafeForm],
  );

  return { handleSlugChange, syncAutoSlugState };
}
