"use client";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { showToast } from "@calcom/ui/components/toast";
import { usePathname, useRouter } from "next/navigation";
import type { FormValues } from "../components/UserForm";
import { UserForm } from "../components/UserForm";

type DuplicateUserValidationMessage = "email_already_used" | "username_already_taken";

function isDuplicateUserValidationMessage(value: unknown): value is DuplicateUserValidationMessage {
  return value === "email_already_used" || value === "username_already_taken";
}

function getDuplicateUserValidationMessage(data: unknown): DuplicateUserValidationMessage | undefined {
  if (typeof data !== "object" || data === null || !("zodError" in data)) return;
  const zodError = data.zodError;
  if (typeof zodError !== "object" || zodError === null || !("fieldErrors" in zodError)) return;
  const fieldErrors = zodError.fieldErrors;
  if (typeof fieldErrors !== "object" || fieldErrors === null) return;

  for (const messages of Object.values(fieldErrors)) {
    if (!Array.isArray(messages)) continue;
    const message = messages.find(isDuplicateUserValidationMessage);
    if (message) return message;
  }
}

export default function UsersAddView() {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const utils = trpc.useUtils();

  const mutation = trpc.viewer.users.add.useMutation({
    onSuccess: async () => {
      showToast(t("user_added_successfully"), "success");
      await utils.viewer.users.list.invalidate();
      if (pathname !== null) {
        router.replace(pathname.replace("/add", ""));
      }
    },
    onError: (err) => {
      console.error(err.message);
      const duplicateMessage = getDuplicateUserValidationMessage(err.data);
      showToast(t(duplicateMessage ?? "error_adding_user"), "error");
    },
  });

  return (
    <UserForm
      submitLabel="add"
      onSubmit={(values: FormValues) => {
        const data: Record<string, unknown> = {
          name: values.name,
          email: values.email,
          username: values.username,
          bio: values.bio,
          timeZone: values.timeZone,
          weekStart: values.weekStart?.value,
          theme: values.theme,
          defaultScheduleId: values.defaultScheduleId,
          locale: values.locale?.value,
          timeFormat: values.timeFormat?.value,
          allowDynamicBooking: values.allowDynamicBooking,
          identityProvider: values.identityProvider?.value,
          role: values.role?.value,
          avatarUrl: values.avatarUrl,
        };
        mutation.mutate(data as Parameters<typeof mutation.mutate>[0]);
      }}
    />
  );
}
