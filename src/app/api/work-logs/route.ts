import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { getTotalWorkHours, validateWorkHours } from '@/utils/workTime'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      timezone: '+09:00'
    })

    const [rows] = await connection.execute(
      `SELECT 
         TIMSHEET_MGR_ID as id,
         LOGIN_ID as loginId,
         DATE_FORMAT(ST_DTM, '%Y-%m-%d') as date,
         DATE_FORMAT(ST_DTM, '%H:%i') as start_time,
         DATE_FORMAT(ED_DTM, '%H:%i') as end_time,
         BIZ_CD as bizCode,
         BIZ_TP as bizType,
         REMK as description
       FROM CM_TIMESHEET_MGR 
       WHERE LOGIN_ID = ? 
       AND DATE(ST_DTM) >= ? 
       AND DATE(ST_DTM) <= ?
       ORDER BY DATE(ST_DTM) DESC, ST_DTM ASC`,
      [Number(userId), startDate, endDate]
    )

    return NextResponse.json({ 
      success: true,
      workLogs: rows 
    })
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
    const { username: userId, workLogs } = body

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      timezone: '+09:00'
    })

    // 각 업무 로그에 대해 시간 검증
    for (const log of workLogs) {
      const currentHours = await getTotalWorkHours(connection, Number(userId), log.date);
      const validation = validateWorkHours(currentHours, log.start_time, log.end_time);
      
      if (!validation.isValid) {
        return NextResponse.json(
          { 
            success: false, 
            message: validation.message
          },
          { status: 400 }
        )
      }
    }

    await connection.beginTransaction()

    for (const log of workLogs) {
      const startDateTime = `${log.date} ${log.start_time}:00`
      const endDateTime = `${log.date} ${log.end_time}:00`

      await connection.execute(
        `INSERT INTO CM_TIMESHEET_MGR 
         (LOGIN_ID, ST_DTM, ED_DTM, BIZ_CD, BIZ_TP, REMK, REG_DTM, REG_USER_ID, MOD_DTM, MOD_USER_ID)
         VALUES (?, ?, ?, ?, ?, ?, now(), ?, now(), ?)`,
        [
          Number(userId),
          startDateTime,
          endDateTime,
          log.bizCode,
          log.bizType,
          log.description || '',
          Number(userId),
          Number(userId)
        ]
      )
    }

    await connection.commit()
    return NextResponse.json({ success: true })
  } catch (error) {
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