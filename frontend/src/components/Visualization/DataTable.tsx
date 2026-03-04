import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface DataTableProps {
  columns: ColumnsType<Record<string, unknown>>
  data: Record<string, unknown>[]
}

export default function DataTable({ columns, data }: DataTableProps) {
  return (
    <Table
      columns={columns}
      dataSource={data}
      size="small"
      pagination={false}
      scroll={{ y: 220 }}
    />
  )
}
