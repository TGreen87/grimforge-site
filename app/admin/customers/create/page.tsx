"use client";

import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import type { CustomerFormValues } from "../../types";

const { TextArea } = Input;

export default function CustomerCreate() {
  const { formProps, saveButtonProps } = useForm<CustomerFormValues>({
    resource: "customers",
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Email is required" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="First Name" name="first_name">
          <Input />
        </Form.Item>

        <Form.Item label="Last Name" name="last_name">
          <Input />
        </Form.Item>

        <Form.Item label="Phone" name="phone">
          <Input />
        </Form.Item>

        <Form.Item label="Notes" name="notes">
          <TextArea rows={4} placeholder="Internal notes about this customer" />
        </Form.Item>
      </Form>
    </Create>
  );
}