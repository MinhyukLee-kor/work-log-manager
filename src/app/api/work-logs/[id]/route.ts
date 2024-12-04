import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// 단일 업무 조회
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      timezone: '+09:00'
    })

    const [rows]: any = await connection.execute(
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
       WHERE TIMSHEET_MGR_ID = ? 
       AND LOGIN_ID = ?`,
      [params.id, Number(userId)]
    )
    
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: '해당 업무 내역을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      workLog: rows[0] 
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

// 업무 수정
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const body = await request.json()
    const { userId, workLog } = body

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      timezone: '+09:00'
    })

    const startDateTime = `${workLog.date} ${workLog.start_time}:00`
    const endDateTime = `${workLog.date} ${workLog.end_time}:00`

    await connection.execute(
      `UPDATE CM_TIMESHEET_MGR 
       SET ST_DTM = ?,
           ED_DTM = ?,
           BIZ_CD = ?,
           BIZ_TP = ?,
           REMK = ?,
           MOD_DTM = now(),
           MOD_USER_ID = ?
       WHERE TIMSHEET_MGR_ID = ? 
       AND LOGIN_ID = ?`,
      [
        startDateTime,
        endDateTime,
        workLog.bizCode,
        workLog.bizType,
        workLog.description || '',
        Number(userId),
        params.id,
        Number(userId)
      ]
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

// 업무 삭제
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      timezone: '+09:00'
    })

    await connection.execute(
      `DELETE FROM CM_TIMESHEET_MGR 
       WHERE TIMSHEET_MGR_ID = ? 
       AND LOGIN_ID = ?`,
      [params.id, Number(userId)]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('업무 삭제 에러:', error)
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