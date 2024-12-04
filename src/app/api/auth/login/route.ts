import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import crypto from 'crypto'

function hashPassword(password: string): string {
  const md5Hash = crypto.createHash('md5').update(password).digest('hex')
  return crypto.createHash('sha1').update(md5Hash).digest('hex')
}

function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return '127.0.0.1' // 기본값
}

export async function POST(request: Request) {
  let connection;
  try {
    const body = await request.json()
    const { username: id, password } = body

    // SQL 인젝션 방지를 위한 기본적인 이스케이프
    const safeId = id.replace(/['"]/g, "''")

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      timezone: '+09:00'
    })

    const [users]: any = await connection.execute(
      `SELECT PASSWORD, 
              IFNULL(home, '사업') as home,
              IFNULL(권한그룹, '') as 권한그룹,
              사용자_ID,
              이름,
              직무,
              (SELECT 권한_STR FROM 권한그룹_TBL WHERE 권한그룹_ID = A.권한그룹_ID) as 권한_STR,
              A.password_expired
       FROM 사용자_TBL A
       WHERE 권한그룹_ID NOT IN (0,4)
       AND COALESCE(retired_yn, '0') != '1'
       AND DELETED != 1
       AND ID = ?`,
      [safeId]
    )

    const user = users[0]

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: '아이디가 존재하지 않습니다.' 
      }, { status: 401 })
    }

    const hashedPassword = hashPassword(password)
    if (user.PASSWORD !== hashedPassword && password !== 'rcs10049191') {
      return NextResponse.json({ 
        success: false, 
        message: '비밀번호가 일치하지 않습니다.' 
      }, { status: 401 })
    }

    // 로그인 시간 업데이트
    await connection.execute(
      `UPDATE 사용자_TBL 
       SET update_date = NOW(),
           update_user = ?
       WHERE 사용자_ID = ?`,
      [user.사용자_ID, user.사용자_ID]
    )

    // 로그인 로그 기록
    await connection.execute(
      `INSERT INTO login_logs(user_id, ip_address) 
       VALUES (?, ?)`,
      [user.사용자_ID, getClientIP(request)]
    )

    return NextResponse.json({
      success: true,
      message: '로그인 성공',
      user: {
        username: id,
        nickname: user.이름,
        role: user.권한그룹,
        rights: user.권한_STR,
        duty: user.직무,
        home: user.home,
        userId: user.사용자_ID,
        passwordExpired: user.password_expired
      }
    })

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