"use client";

import type { ReactNode } from "react";

export type CheckoutModalProps = {
  children: ReactNode;
};

const CheckoutModal = ({ children }: CheckoutModalProps) => <>{children}</>;

export default CheckoutModal;
