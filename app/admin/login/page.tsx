"use client";

import { useState } from "react";
import { useLogin } from "@refinedev/core";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function LoginPage() {
  const { mutate: login, isLoading } = useLogin();
  const [form] = Form.useForm();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      await login(values);
    } catch (error) {
      message.error("Login failed. Please check your credentials.");
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
    }}>
      <Card 
        style={{ 
          width: 400, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          background: 'rgba(255,255,255,0.95)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#8B0000', marginBottom: 8 }}>
            Obsidian Rite Records Admin
          </Title>
          <p style={{ color: '#666', margin: 0 }}>
            Enter the realm of metal
          </p>
        </div>
        
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="arg@obsidianriterecords.com" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Enter your password" 
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
              style={{ 
                width: '100%', 
                height: 48,
                background: '#8B0000',
                borderColor: '#8B0000',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {isLoading ? 'Entering...' : 'Enter the Realm'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}