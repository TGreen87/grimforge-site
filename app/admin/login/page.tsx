"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@refinedev/core";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { getSupabaseBrowserClient } from "@/integrations/supabase/browser";

const { Title } = Typography;

export default function LoginPage() {
  const { mutate: login, isLoading } = useLogin();
  const router = useRouter();
  const isPreview = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /netlify\.app$/.test(window.location.hostname);
  }, []);
  const [form] = Form.useForm();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      // On Netlify previews, navigate immediately to /admin to avoid waiting on auth
      if (isPreview) {
        router.push('/admin');
        // Fire-and-forget attempt to establish a session in the background
        try { (login as any)(values); } catch {}
        return;
      }
      await login(values);
    } catch (error) {
      message.error("Login failed. Please check your credentials.");
    }
  };

  const onGoogleSignIn = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: origin ? `${origin}/admin` : undefined,
          queryParams: {
            prompt: 'consent',
            access_type: 'offline',
          },
        },
      });
    } catch (e) {
      message.error('Google sign-in failed');
    }
  }

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
            Obsidian Rite Records · Admin
          </Title>
          <p style={{ color: '#888', margin: 0 }}>
            Sign in to manage products, inventory, and orders
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
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </Form.Item>

          <div style={{ marginTop: 12 }}>
            <Button onClick={onGoogleSignIn} style={{ width: '100%', height: 44 }}>
              Continue with Google
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
