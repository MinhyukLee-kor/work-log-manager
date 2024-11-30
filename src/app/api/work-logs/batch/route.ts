import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function PUT(request: Request) {
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

    await connection.beginTransaction()

    for (const log of workLogs) {
      if (log.id.startsWith('temp-')) {
        // 새로 추가된 항목은 INSERT
        await connection.execute(
          `INSERT INTO work_logs (username, date, start_time, end_time, description)
           VALUES (?, ?, ?, ?, ?)`,
          [username, log.date, log.start_time, log.end_time, log.description]
        )
      } else {
        // 기존 항목은 UPDATE
        await connection.execute(
          `UPDATE work_logs 
           SET date = ?, start_time = ?, end_time = ?, description = ?
           WHERE id = ? AND username = ?`,
          [log.date, log.start_time, log.end_time, log.description, log.id, username]
        )
      }
    }

    await connection.commit()
    return NextResponse.json({ success: true })
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }
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