"use client";

import React, { useMemo, useState } from "react";
import { List, useTable, DateField, BooleanField, NumberField, TextField, TagField } from "@refinedev/antd";
import { Table, Space, Button, Tag, Modal, InputNumber, Radio, message, Switch } from "antd";
import AdminTableToolbar, { TableSize } from "../ui/AdminTableToolbar";
import AdminViewToggle, { AdminView, getStoredView } from "../ui/AdminViewToggle";
import { Segmented } from "antd";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from 'antd/es/table'
import AdminColumnSettings, { getStoredColumns } from "../ui/AdminColumnSettings";
import Link from "next/link";
import type { Product } from "../types";
import { getSupabaseBrowserClient } from "@/integrations/supabase/browser";

function InlinePrice({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const [value, setValue] = React.useState<number>(product.price);
  const [saving, setSaving] = React.useState(false);
  const save = async () => {
    if (value === product.price) return;
    try {
      setSaving(true);
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('products').update({ price: value }).eq('id', product.id);
      if (error) throw error;
      onSaved();
    } catch (e:any) { message.error(e.message || 'Failed to save'); } finally { setSaving(false); }
  };
  return (
    <div className="flex items-center gap-2">
      <InputNumber min={0} step={0.01} value={value} onChange={(v)=>setValue(Number(v||0))} onBlur={save} disabled={saving} />
    </div>
  );
}

function InlineActive({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const [val, setVal] = React.useState<boolean>(product.active);
  const [saving, setSaving] = React.useState(false);
  const toggle = async (checked:boolean) => {
    setVal(checked);
    try {
      setSaving(true);
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('products').update({ active: checked }).eq('id', product.id);
      if (error) throw error;
      onSaved();
    } catch (e:any) { message.error(e.message || 'Failed to update'); } finally { setSaving(false); }
  };
  return <Switch checked={val} onChange={toggle} disabled={saving} />
}

export default function ProductList() {
  const { tableProps, tableQueryResult } = useTable<Product>({
    resource: "products",
    sorters: {
      initial: [
        {
          field: "created_at",
          order: "desc",
        },
      ],
    },
  });

  const bulkEnabled = process.env.NEXT_PUBLIC_ENABLE_ADMIN_BULK === '1'
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [priceOpen, setPriceOpen] = useState(false)
  const [activeOpen, setActiveOpen] = useState(false)
  const [priceMode, setPriceMode] = useState<'absolute'|'percent'|'delta'>('percent')
  const [priceValue, setPriceValue] = useState<number>(10)
  const [loading, setLoading] = useState(false)

  const doBulkPrice = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/products/bulk/price', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ ids: selectedRowKeys, mode: priceMode, value: priceValue })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Bulk price failed')
      message.success(`Updated ${data.updated} product price(s)`) 
      setSelectedRowKeys([]); setPriceOpen(false)
    } catch (e:any) { message.error(e.message) } finally { setLoading(false) }
  }

  const [nextActive, setNextActive] = useState(true)
  const doBulkActive = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/products/bulk/active', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ ids: selectedRowKeys, active: nextActive })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Bulk active failed')
      message.success(`Updated ${data.updated} product(s)`) 
      setSelectedRowKeys([]); setActiveOpen(false)
    } catch (e:any) { message.error(e.message) } finally { setLoading(false) }
  }

  const [size, setSize] = useState<TableSize>("small")
  const [view, setView] = useState<AdminView>(typeof window === 'undefined' ? 'table' : getStoredView('products'))
  const [quickFilter, setQuickFilter] = useState<'all'|'active'|'inactive'|'featured'>('all')
  const allColumnDefs = [
    { key: 'title', label: 'Title' },
    { key: 'artist', label: 'Artist' },
    { key: 'format', label: 'Format' },
    { key: 'price', label: 'Price' },
    { key: 'stock', label: 'Stock' },
    { key: 'active', label: 'Active' },
    { key: 'featured', label: 'Featured' },
    { key: 'created_at', label: 'Created' },
    { key: 'actions', label: 'Actions' },
  ] as const
  const defaultVisible = allColumnDefs.map(c => c.key)
  const [visible, setVisible] = useState<string[]>(typeof window === 'undefined' ? defaultVisible : getStoredColumns('products', defaultVisible))

  const columns: ColumnsType<Product> = [
    {
      key: 'title',
      dataIndex: 'title',
      title: 'Title',
      render: (value: string) => <TextField value={value} />,
      sorter: true,
    },
    {
      key: 'artist',
      dataIndex: 'artist',
      title: 'Artist',
      render: (value: string) => <TextField value={value} />,
      sorter: true,
    },
    {
      key: 'format',
      dataIndex: 'format',
      title: 'Format',
      render: (value: string) => <TagField value={value} />,
    },
    {
      key: 'price',
      dataIndex: 'price',
      title: 'Price',
      render: (_: any, record: Product) => <InlinePrice product={record} onSaved={()=>tableQueryResult.refetch()} />,
      sorter: true,
    },
    {
      key: 'stock',
      dataIndex: 'stock',
      title: 'Stock',
      render: (value: number) => (
        <Tag color={value > 0 ? "green" : "red"}>{value}</Tag>
      ),
      sorter: true,
    },
    {
      key: 'active',
      dataIndex: 'active',
      title: 'Active',
      render: (_: any, record: Product) => <InlineActive product={record} onSaved={()=>tableQueryResult.refetch()} />,
    },
    {
      key: 'featured',
      dataIndex: 'featured',
      title: 'Featured',
      render: (value: boolean) => <BooleanField value={value} />,
    },
    {
      key: 'created_at',
      dataIndex: 'created_at',
      title: 'Created',
      render: (value: string) => <DateField value={value} format="YYYY-MM-DD" />,
      sorter: true,
    },
    {
      key: 'actions',
      dataIndex: 'actions',
      title: 'Actions',
      render: (_: any, record: Product) => (
        <Space>
          <Link href={`/admin/products/show/${record.id}`}>
            <Button size="small" icon={<EyeOutlined />} />
          </Link>
          <Link href={`/admin/products/edit/${record.id}`}>
            <Button size="small" icon={<EditOutlined />} />
          </Link>
        </Space>
      ),
    },
  ].filter(col => visible.includes(col.key as string))

  return (
    <List
      headerButtons={(
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <AdminTableToolbar
            title="Products"
            size={size}
            onSizeChange={setSize}
            onRefresh={() => tableQueryResult.refetch()}
            onExport={() => {}}
            searchPlaceholder="Search products"
            rightSlot={<Space>
              {view === 'cards' && (
                <Segmented size="small" value={quickFilter} onChange={(v)=>setQuickFilter(v as any)} options={[
                  { label: 'All', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                  { label: 'Featured', value: 'featured' },
                ]} />
              )}
              <AdminColumnSettings resource="products" columns={allColumnDefs as any} value={visible} onChange={setVisible} />
              <AdminViewToggle resource="products" value={view} onChange={setView} />
            </Space>}
          />
          {bulkEnabled && (
            <Space>
              <Button disabled={selectedRowKeys.length===0} onClick={()=>setPriceOpen(true)}>Bulk Price</Button>
              <Button disabled={selectedRowKeys.length===0} onClick={()=>setActiveOpen(true)}>Set Active</Button>
            </Space>
          )}
        </Space>
      )}
    >
      {view === 'table' ? (
      <Table 
        {...tableProps} 
        columns={columns}
        rowKey="id" 
        size={size}
        sticky
        rowClassName={(_, index) => (index % 2 === 1 ? 'admin-row-zebra' : '')}
        tableLayout="fixed"
        rowSelection={{ selectedRowKeys, onChange:setSelectedRowKeys }}
      />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {((tableProps.dataSource as Product[] | undefined) || [])
            .filter((p) => quickFilter==='all' ? true : quickFilter==='featured' ? (p as any).featured : quickFilter==='active' ? (p as any).active : !(p as any).active)
            .map((p) => (
            <div key={p.id} className="border border-border rounded-lg p-4 bg-[#0b0b0b]">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-secondary/30 rounded overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={(p as any).image || (p as any).image_url || '/placeholder.svg'} alt={p.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="m-0 text-bone truncate">{p.title}</h4>
                    {p.featured && <span className="text-xs px-2 py-0.5 rounded bg-yellow-600/30 text-yellow-300">Featured</span>}
                    {!p.active && <span className="text-xs px-2 py-0.5 rounded bg-gray-600/30 text-gray-300">Inactive</span>}
                  </div>
                  {p.artist && <div className="text-xs text-muted-foreground truncate">{p.artist}</div>}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <InlinePrice product={p as any} onSaved={()=>tableQueryResult.refetch()} />
                  <span className={`text-xs px-2 py-0.5 rounded ${p.stock > 0 ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>{p.stock}</span>
                </div>
                <InlineActive product={p as any} onSaved={()=>tableQueryResult.refetch()} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Link href={`/admin/products/show/${p.id}`}><Button size="small">View</Button></Link>
                <Link href={`/admin/products/edit/${p.id}`}><Button size="small">Edit</Button></Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Price Modal */}
      <Modal title="Bulk Price Update" open={priceOpen} onCancel={()=>setPriceOpen(false)} onOk={doBulkPrice} confirmLoading={loading} okText="Apply">
        <Radio.Group value={priceMode} onChange={(e)=>setPriceMode(e.target.value)}>
          <Radio.Button value="percent">Percent %</Radio.Button>
          <Radio.Button value="delta">Delta ±</Radio.Button>
          <Radio.Button value="absolute">Absolute</Radio.Button>
        </Radio.Group>
        <div style={{ marginTop: 12 }}>
          <InputNumber value={priceValue} onChange={(v)=>setPriceValue(Number(v||0))} style={{ width:'100%' }} />
        </div>
        <p style={{ marginTop: 8 }} className="text-xs text-muted-foreground">Applies to {selectedRowKeys.length} selected product(s).</p>
      </Modal>

      {/* Bulk Active Modal */}
      <Modal title="Set Active" open={activeOpen} onCancel={()=>setActiveOpen(false)} onOk={doBulkActive} confirmLoading={loading} okText="Apply">
        <div className="flex items-center gap-3">
          <span>Active</span>
          <Switch checked={nextActive} onChange={setNextActive as any} />
        </div>
        <p style={{ marginTop: 8 }} className="text-xs text-muted-foreground">Applies to {selectedRowKeys.length} selected product(s).</p>
      </Modal>
    </List>
  );
}
