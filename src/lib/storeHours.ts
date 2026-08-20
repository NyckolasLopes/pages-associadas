import { format, getDay, isBefore, isAfter, setHours, setMinutes, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HorarioDia { dia: number; abre: string; fecha: string; fechado: boolean; }
interface DataEspecial { data: string; abre: string; fecha: string; fechado: boolean; descricao?: string; }

export interface StoreStatus {
  isOpen: boolean;
  message?: string;
  nextOpenDate?: Date;
}

export function getStoreStatus(
  horariosPorDia?: HorarioDia[],
  datasEspeciais?: DataEspecial[],
  now: Date = new Date()
): StoreStatus {
  const defaultHorarios = [0,1,2,3,4,5,6].map(dia => ({ dia, abre: '08:00', fecha: '18:00', fechado: dia === 0 }));
  const horarios = horariosPorDia?.length ? horariosPorDia : defaultHorarios;
  const especiais = datasEspeciais || [];

  const parseTime = (timeStr: string, baseDate: Date) => {
    const [h, m] = timeStr.split(':').map(Number);
    return setMinutes(setHours(baseDate, h), m);
  };

  const getDayConfig = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const especial = especiais.find(e => e.data === dateString);
    if (especial) return especial;

    const dayOfWeek = getDay(date);
    return horarios.find(h => h.dia === dayOfWeek) || { fechado: true, abre: '08:00', fecha: '18:00' };
  };

  const configToday = getDayConfig(now);

  if (configToday.fechado) {
    return { isOpen: false, ...findNextOpen(now, horarios, especiais) };
  }

  const openTime = parseTime(configToday.abre, now);
  const closeTime = parseTime(configToday.fecha, now);

  if (isBefore(now, openTime)) {
    return { 
      isOpen: false, 
      message: `A loja abrirá hoje às ${configToday.abre}.`,
      nextOpenDate: openTime
    };
  }

  if (isAfter(now, closeTime)) {
    return { isOpen: false, ...findNextOpen(addDays(now, 1), horarios, especiais, true) };
  }

  return { isOpen: true };
}

function findNextOpen(
  startDate: Date, 
  horarios: HorarioDia[], 
  especiais: DataEspecial[],
  isNextDay = false
): { message: string, nextOpenDate?: Date } {
  let currentDate = startDate;
  currentDate = setMinutes(setHours(currentDate, 0), 0);

  for (let i = 0; i < 7; i++) {
    const dateString = format(currentDate, 'yyyy-MM-dd');
    const especial = especiais.find(e => e.data === dateString);
    
    let isFechado = false;
    let abre = '';

    if (especial) {
      isFechado = especial.fechado;
      abre = especial.abre;
    } else {
      const dayOfWeek = getDay(currentDate);
      const normal = horarios.find(h => h.dia === dayOfWeek);
      if (normal) {
        isFechado = normal.fechado;
        abre = normal.abre;
      } else {
        isFechado = true;
      }
    }

    if (!isFechado) {
      const isTomorrow = i === (isNextDay ? 0 : 1);
      const isToday = i === 0 && !isNextDay;
      const [h, m] = abre.split(':').map(Number);
      const nextDate = setMinutes(setHours(currentDate, h), m);
      
      let msg = '';
      if (isToday) {
         msg = `A loja abrirá hoje às ${abre}.`;
      } else if (isTomorrow) {
         msg = `A loja abrirá amanhã às ${abre}.`;
      } else {
         msg = `A loja abrirá ${format(currentDate, 'EEEE', { locale: ptBR })} às ${abre}.`;
      }

      return { message: msg, nextOpenDate: nextDate };
    }

    currentDate = addDays(currentDate, 1);
  }

  return { message: "A loja está fechada temporariamente." };
}
