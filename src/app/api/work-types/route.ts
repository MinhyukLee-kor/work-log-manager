import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { RowDataPacket } from 'mysql2'

interface WorkTypeRow extends RowDataPacket {
  BIZ_TP: string;
  BIZ_CD: string;
  BIZ_NM: string;
}

export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    const [rows] = await connection.execute<WorkTypeRow[]>('CALL select_timsheet_bizcode()')

    return NextResponse.json({ 
      success: true, 
      workTypes: rows[0]
    })
  } catch (error) {
    console.error('업무 종류 조회 에러:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end()
    }
  }
} 