import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { getTotalWorkHours, validateWorkHours, checkDBTimeOverlap } from '@/utils/workTime'

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
         CTM.TIMSHEET_MGR_ID as id,
         CTM.LOGIN_ID as loginId,
         DATE_FORMAT(CTM.ST_DTM, '%Y-%m-%d') as date,
         DATE_FORMAT(CTM.ST_DTM, '%H:%i') as start_time,
         DATE_FORMAT(CTM.ED_DTM, '%H:%i') as end_time,
         CTM.BIZ_CD as bizCode,
         VT.BIZ_NM as bizName,
         CTM.BIZ_TP as bizType,
         CTM.REMK as description
       FROM CM_TIMESHEET_MGR CTM
       LEFT JOIN vw_timsheet_bizcode VT
       ON CTM.BIZ_CD = VT.BIZ_CD
       WHERE CTM.LOGIN_ID = ? 
       AND DATE(CTM.ST_DTM) >= ? 
       AND DATE(CTM.ST_DTM) <= ?
       ORDER BY DATE(CTM.ST_DTM) DESC, CTM.ST_DTM ASC`,
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

    // 각 업무 로그에 대해 검증
    for (const log of workLogs) {
      // 1. 먼저 시간 중복 검증
      const overlapCheck = await checkDBTimeOverlap(
        connection,
        Number(userId),
        log.date,
        log.start_time,
        log.end_time
      );

      if (overlapCheck.isOverlapping) {
        return NextResponse.json(
          { success: false, message: overlapCheck.message },
          { status: 400 }
        );
      }

      // 2. 그 다음 총 업무 시간 검증
      const currentHours = await getTotalWorkHours(connection, Number(userId), log.date);
      const validation = validateWorkHours(currentHours, log.start_time, log.end_time);
      
      if (!validation.isValid) {
        return NextResponse.json(
          { success: false, message: validation.message },
          { status: 400 }
        );
      }
    }

    // 모든 검증을 통과한 경우에만 트랜잭션 시작
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