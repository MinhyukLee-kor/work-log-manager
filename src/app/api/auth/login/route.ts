import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function POST(request: Request) {
  let connection;
  try {
    const body = await request.json()
    const { username, password } = body

    // MySQL 연결 설정
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    console.log('DB 연결 성공')

    // 사용자 확인 쿼리
    const [rows]: any = await connection.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    )

    console.log('쿼리 결과:', rows)

    if (rows.length > 0) {
      return NextResponse.json({
        success: true,
        role: rows[0].role,
        message: '로그인 성공'
      })
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: '아이디 또는 비밀번호가 일치하지 않습니다.' 
        },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('로그인 에러:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end()
    }
  }
} 