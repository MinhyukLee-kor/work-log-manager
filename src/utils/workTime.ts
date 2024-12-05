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
