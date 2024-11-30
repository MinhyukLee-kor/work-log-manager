import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    const [rows] = await connection.execute(
      `SELECT * FROM work_logs 
       WHERE username = ? 
       AND date BETWEEN ? AND ?
       ORDER BY date DESC, start_time ASC`,
      [username, startDate, endDate]
    )

    return NextResponse.json({ workLogs: rows })
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

export async function POST(request: Request) {
  let connection;
  try {
    const body = await request.json()
    const { username, workLogs } = body

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    // 트랜잭션 시작
    await connection.beginTransaction()

    for (const log of workLogs) {
      await connection.execute(
        `INSERT INTO work_logs (username, date, start_time, end_time, description)
         VALUES (?, ?, ?, ?, ?)`,
        [username, log.date, log.start_time, log.end_time, log.description]
      )
    }

    // 트랜잭션 커밋
    await connection.commit()

    return NextResponse.json({ success: true })
  } catch (error) {
    // 트랜잭션 롤백
    if (connection) {
      await connection.rollback()
    }
    
    console.error('업무 등록 에러:', error)
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