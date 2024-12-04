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

    const [rows] = await connection.execute<WorkTypeRow[]>(`
      SELECT 'P' AS BIZ_TP, X1.프로젝트_ID AS BIZ_CD, X1.프로젝트명 AS BIZ_NM
      FROM 프로젝트_TBL X1
      WHERE DATE_FORMAT(now(), '%Y-%m-%d') BETWEEN X1.실투입기간_시작 AND X1.실투입기간_종료
      UNION ALL
      SELECT 'C' AS BIZ_TP, 'C001' AS BIZ_CD, '출장' AS BIZ_NM
      UNION ALL
      SELECT 'C' AS BIZ_TP, 'C002' AS BIZ_CD, '교육' AS BIZ_NM
      UNION ALL
      SELECT 'C' AS BIZ_TP, 'C003' AS BIZ_CD, '기타외부활동' AS BIZ_NM
    `)

    return NextResponse.json({ 
      success: true, 
      workTypes: rows
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