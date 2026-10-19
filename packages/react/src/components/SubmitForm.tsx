"use client";

import { useState } from "react";
import { LIMITS } from "../client/constants";
import { userMessage } from "../client/errors";
import { useSubmitFeature } from "../hooks/useSubmitFeature";
import { useBoard } from "./BoardContext";

export function SubmitForm(): React.JSX.Element {
  const { labels, emailField, userEmail, isSubscriber, setFormOpen, setJustSubmitted, cx } =
    useBoard();
  const { submit, isPending, error } = useSubmitFeature();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState(userEmail ?? "");

  return (
    <form
      className={cx("fw-form")}
      onSubmit={async (event) => {
        event.preventDefault();
        const created = await submit({
          title,
          description,
          ...(emailField !== "off" && email ? { email } : {}),
          isSubscriber,
        });
        if (!created) return;
        setTitle("");
        setDescription("");
        setJustSubmitted(true);
        setFormOpen(false);
      }}
    >
      <div className={cx("fw-field")}>
        <label className={cx("fw-label")} htmlFor="fw-title">
          {labels.fieldTitle}
        </label>
        <input
          id="fw-title"
          className={cx("fw-input")}
          value={title}
          minLength={LIMITS.titleMin}
          maxLength={LIMITS.titleMax}
          placeholder={labels.fieldTitlePlaceholder}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>

      <div className={cx("fw-field")}>
        <label className={cx("fw-label")} htmlFor="fw-description">
          {labels.fieldDescription}
        </label>
        <textarea
          id="fw-description"
          className={cx("fw-input", "fw-textarea")}
          value={description}
          maxLength={LIMITS.descriptionMax}
          placeholder={labels.fieldDescriptionPlaceholder}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      {emailField !== "off" && (
        <div className={cx("fw-field")}>
          <label className={cx("fw-label")} htmlFor="fw-email">
            {labels.fieldEmail}
          </label>
          <input
            id="fw-email"
            className={cx("fw-input")}
            type="email"
            value={email}
            placeholder={labels.followPlaceholder}
            aria-describedby="fw-email-hint"
            onChange={(event) => setEmail(event.target.value)}
            required={emailField === "required"}
          />
          <p id="fw-email-hint" className={cx("fw-muted")}>
            {labels.fieldEmailHint}
          </p>
        </div>
      )}

      {error && (
        <p className={cx("fw-error")} role="alert">
          {userMessage(error)}
        </p>
      )}

      <div className={cx("fw-form__actions")}>
        <button type="submit" className={cx("fw-btn")} disabled={isPending}>
          {isPending ? labels.submitting : labels.submit}
        </button>
        <button
          type="button"
          className={cx("fw-btn", "fw-btn--ghost")}
          onClick={() => setFormOpen(false)}
        >
          {labels.cancel}
        </button>
      </div>
    </form>
  );
}
