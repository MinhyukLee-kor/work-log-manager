import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function DELETE(request: Request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const date = searchParams.get('date')

    if (!username || !date) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    await connection.beginTransaction()

    const [result]: any = await connection.execute(
      'DELETE FROM work_logs WHERE username = ? AND date = ?',
      [username, date]
    )

    await connection.commit()

    if (result.affectedRows > 0) {
      return NextResponse.json({ 
        success: true,
        message: '삭제되었습니다.'
      })
    } else {
      return NextResponse.json(
        { success: false, message: '삭제할 데이터가 없습니다.' },
        { status: 404 }
      )
    }
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }
    console.error('업무 내역 삭제 에러:', error)
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