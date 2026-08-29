"use client";

import React from "react";

/**
 * A client component select that automatically submits its parent form on change.
 * Useful for filtering forms in Server Components where you can't pass an inline onChange handler.
 */
export default function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      onChange={(e) => {
        if (props.onChange) {
          props.onChange(e);
        } else {
          e.target.form?.submit();
        }
      }}
    />
  );
}
