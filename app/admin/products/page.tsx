"use client";

import React, { useMemo, useState } from "react";
import { List, useTable, DateField, BooleanField, NumberField, TextField, TagField } from "@refinedev/antd";
import { Table, Space, Button, Tag, Modal, InputNumber, Radio, message, Switch } from "antd";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { Product } from "../types";

export default function ProductList() {
  const { tableProps } = useTable<Product>({
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

  return (
    <List
      headerButtons={bulkEnabled ? (
        <Space>
          <Button disabled={selectedRowKeys.length===0} onClick={()=>setPriceOpen(true)}>Bulk Price</Button>
          <Button disabled={selectedRowKeys.length===0} onClick={()=>setActiveOpen(true)}>Set Active</Button>
        </Space>
      ) : undefined}
    >
      <Table {...tableProps} rowKey="id" rowSelection={{ selectedRowKeys, onChange:setSelectedRowKeys }}>
        <Table.Column
          dataIndex="title"
          title="Title"
          render={(value: string) => <TextField value={value} />}
          sorter
        />
        <Table.Column
          dataIndex="artist"
          title="Artist"
          render={(value: string) => <TextField value={value} />}
          sorter
        />
        <Table.Column
          dataIndex="format"
          title="Format"
          render={(value: string) => <TagField value={value} />}
        />
        <Table.Column
          dataIndex="price"
          title="Price"
          render={(value: number) => <NumberField value={value} options={{ style: "currency", currency: "AUD" }} />}
          sorter
        />
        <Table.Column
          dataIndex="stock"
          title="Stock"
          render={(value: number) => (
            <Tag color={value > 0 ? "green" : "red"}>
              {value}
            </Tag>
          )}
          sorter
        />
        <Table.Column
          dataIndex="active"
          title="Active"
          render={(value: boolean) => <BooleanField value={value} />}
        />
        <Table.Column
          dataIndex="featured"
          title="Featured"
          render={(value: boolean) => <BooleanField value={value} />}
        />
        <Table.Column
          dataIndex="created_at"
          title="Created"
          render={(value: string) => <DateField value={value} format="YYYY-MM-DD" />}
          sorter
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          render={(_, record: Product) => (
            <Space>
              <Link href={`/admin/products/show/${record.id}`}>
                <Button size="small" icon={<EyeOutlined />} />
              </Link>
              <Link href={`/admin/products/edit/${record.id}`}>
                <Button size="small" icon={<EditOutlined />} />
              </Link>
            </Space>
          )}
        />
      </Table>

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
