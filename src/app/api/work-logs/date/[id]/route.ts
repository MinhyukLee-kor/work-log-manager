import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    // 먼저 선택한 업무의 날짜를 조회
    const [selectedWork]: any = await connection.execute(
      'SELECT date FROM work_logs WHERE id = ? AND username = ?',
      [params.id, username]
    )

    if (selectedWork.length === 0) {
      return NextResponse.json(
        { success: false, message: '해당 업무 내역을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 해당 날짜의 모든 업무 내역 조회
    const [rows]: any = await connection.execute(
      'SELECT * FROM work_logs WHERE date = ? AND username = ? ORDER BY start_time ASC',
      [selectedWork[0].date, username]
    )

    return NextResponse.json({ success: true, workLogs: rows })
  } catch (error) {
    console.error('업무 내역 조회 에러:', error)
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