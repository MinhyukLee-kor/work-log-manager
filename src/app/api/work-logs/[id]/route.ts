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

    const [rows]: any = await connection.execute(
      'SELECT * FROM work_logs WHERE id = ? AND username = ?',
      [params.id, username]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '해당 업무 내역을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, workLog: rows[0] })
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const body = await request.json()
    const { username, workLog } = body

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    await connection.execute(
      `UPDATE work_logs 
       SET date = ?, start_time = ?, end_time = ?, description = ?
       WHERE id = ? AND username = ?`,
      [workLog.date, workLog.start_time, workLog.end_time, workLog.description, params.id, username]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('업무 수정 에러:', error)
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