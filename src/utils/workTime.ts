import { Connection } from 'mysql2/promise'

// 기존 함수
export async function getTotalWorkHours(connection: Connection, userId: number, date: string, excludeId?: number) {
  const [rows]: any = await connection.execute(
    `SELECT ST_DTM, ED_DTM 
     FROM CM_TIMESHEET_MGR 
     WHERE LOGIN_ID = ? 
     AND DATE(ST_DTM) = ?
     ${excludeId ? 'AND TIMSHEET_MGR_ID != ?' : ''}`,
    excludeId ? [userId, date, excludeId] : [userId, date]
  );

  let totalMinutes = 0;
  rows.forEach((row: any) => {
    const startTime = new Date(row.ST_DTM);
    const endTime = new Date(row.ED_DTM);
    const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    totalMinutes += diffMinutes;
  });

  return totalMinutes / 60;
}

interface ValidationResult {
  isValid: boolean;
  totalHours: number;
  message: string;
}

// 새로운 업무 시간이 9시간을 초과하는지 검증하는 함수
export function validateWorkHours(
  currentHours: number, 
  newStartTime: string, 
  newEndTime: string
): ValidationResult {
  // 새로운 업무 시간을 분 단위로 계산
  const [startHour, startMin] = newStartTime.split(':').map(Number);
  const [endHour, endMin] = newEndTime.split(':').map(Number);
  
  const newMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  const newHours = newMinutes / 60;
  const totalHours = currentHours + newHours;
  
  return {
    isValid: totalHours <= 9,
    totalHours: totalHours,
    message: totalHours > 9 
      ? `입력하신 시간으로 수정할 경우 총 근무시간이 ${totalHours.toFixed(1)}시간이 됩니다. ` +
        `하루 근무시간은 9시간을 초과할 수 없습니다. ` +
        `(기존 근무시간: ${currentHours.toFixed(1)}시간 + 신규 입력: ${newHours.toFixed(1)}시간)`
      : ''
  };
}

interface TimeOverlapResult {
  isOverlapping: boolean;
  message: string;
}

// 두 시간 범위가 겹치는지 확인하는 함수
export function checkTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return (start1 < end2 && end1 > start2);
}

// 프론트엔드에서 여러 업무 시간이 겹치는지 확인
export function validateTimeOverlaps(workLogs: any[]): TimeOverlapResult {
  for (let i = 0; i < workLogs.length; i++) {
    for (let j = i + 1; j < workLogs.length; j++) {
      if (workLogs[i].date === workLogs[j].date) {
        if (checkTimeOverlap(
          workLogs[i].start_time,
          workLogs[i].end_time,
          workLogs[j].start_time,
          workLogs[j].end_time
        )) {
          return {
            isOverlapping: true,
            message: `업무 시간이 겹칩니다: ` +
              `(${workLogs[i].start_time}-${workLogs[i].end_time})와 ` +
              `(${workLogs[j].start_time}-${workLogs[j].end_time})`
          };
        }
      }
    }
  }
  return { isOverlapping: false, message: '' };
}

// DB에서 겹치는 시간이 있는지 확인
export async function checkDBTimeOverlap(
  connection: Connection,
  userId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: number
): Promise<TimeOverlapResult> {
  const [rows]: any = await connection.execute(
    `SELECT DATE_FORMAT(ST_DTM, '%H:%i') as start_time,
            DATE_FORMAT(ED_DTM, '%H:%i') as end_time
     FROM CM_TIMESHEET_MGR 
     WHERE LOGIN_ID = ? 
     AND DATE(ST_DTM) = ?
     ${excludeId ? 'AND TIMSHEET_MGR_ID != ?' : ''}`,
    excludeId ? [userId, date, excludeId] : [userId, date]
  );

  for (const row of rows) {
    if (checkTimeOverlap(startTime, endTime, row.start_time, row.end_time)) {
      return {
        isOverlapping: true,
        message: `입력하신 시간(${startTime}-${endTime})이 ` +
                `기존 업무 시간(${row.start_time}-${row.end_time})과 겹칩니다.`
      };
    }
  }

  return { isOverlapping: false, message: '' };
}

// 시작 시간이 종료 시간보다 늦은지 검사하는 함수
export function validateStartEndTime(startTime: string, endTime: string): ValidationResult {
  if (startTime > endTime) {
    return {
      isValid: false,
      totalHours: 0,
      message: '종료 시간은 시작 시간보다 빠를 수 없습니다.'
    };
  }
  return { isValid: true, totalHours: 0, message: '' };
}
