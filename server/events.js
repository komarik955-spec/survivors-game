// ============================================================
//  СИСТЕМА СОБЫТИЙ РАУНДА
//  Событие генерируется под реальные карты живых игроков
// ============================================================

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function byProfession(players, keywords) {
  return players.filter(p =>
    keywords.some(kw => p.cards.profession.name.includes(kw))
  );
}
function byHealth(players, keywords) {
  return players.filter(p =>
    keywords.some(kw =>
      p.cards.health.name.includes(kw) || (p.cards.health.note || '').includes(kw)
    )
  );
}
function byBiology(players, keywords) {
  return players.filter(p =>
    keywords.some(kw =>
      p.cards.biology.name.includes(kw) || (p.cards.biology.note || '').includes(kw)
    )
  );
}
function byFact(players, keywords) {
  return players.filter(p =>
    keywords.some(kw =>
      p.cards.fact.name.includes(kw) || (p.cards.fact.note || '').includes(kw)
    )
  );
}
function byBaggage(players, keywords) {
  return players.filter(p =>
    keywords.some(kw =>
      p.cards.baggage.name.includes(kw) || (p.cards.baggage.note || '').includes(kw)
    )
  );
}

// ─── ШАБЛОНЫ СОБЫТИЙ ─────────────────────────────────────────
// effect.type: protect | penalty | immunity | expose | none

const TEMPLATES = [

  // ── PROTECT (защита) ──────────────────────────
  {
    try(alive) {
      const t = pick(byProfession(alive, ['Хирург','Медсестра','Фармацевт','Ветеринар']) );
      if (!t) return null;
      return {
        icon: '🦠', title: 'ВСПЫШКА БОЛЕЗНИ',
        description: 'В бункере зафиксированы симптомы у нескольких человек. Без медицинской помощи потери неизбежны.',
        hint: 'Медицинский персонал незаменим прямо сейчас.',
        effect: { type: 'protect', targetId: t.id, targetName: t.name },
        effectLabel: 'ЗАЩИТА',
        effectText: `${t.name} под защитой — для исключения нужно на 2+ голоса больше чем у следующего`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byProfession(alive, ['Ядерный инженер','Электрик','Механик','Программист']));
      if (!t) return null;
      return {
        icon: '⚡', title: 'СБОЙ СИСТЕМ БУНКЕРА',
        description: 'Генератор начал давать перебои. Вентиляция нестабильна. Нужен специалист.',
        hint: 'Технический персонал критически важен прямо сейчас.',
        effect: { type: 'protect', targetId: t.id, targetName: t.name },
        effectLabel: 'ЗАЩИТА',
        effectText: `${t.name} под защитой — для исключения нужно на 2+ голоса больше`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byProfession(alive, ['Агроном','Шеф-повар','Охотник']));
      if (!t) return null;
      return {
        icon: '🌾', title: 'КРИЗИС ПРОДОВОЛЬСТВИЯ',
        description: 'Запасы еды иссякают быстрее прогноза. Организация питания из подручных ресурсов — вопрос выживания.',
        hint: 'Тот, кто умеет добывать и готовить еду — на вес золота.',
        effect: { type: 'protect', targetId: t.id, targetName: t.name },
        effectLabel: 'ЗАЩИТА',
        effectText: `${t.name} под защитой — для исключения нужно на 2+ голоса больше`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byProfession(alive, ['Психолог','Педагог','Священник']));
      if (!t) return null;
      return {
        icon: '🧠', title: 'ПАНИКА В ГРУППЕ',
        description: 'Двое участников на грани нервного срыва. Без психологической поддержки бункер развалится изнутри.',
        hint: 'Тот, кто умеет работать с людьми — сейчас важнее хирурга.',
        effect: { type: 'protect', targetId: t.id, targetName: t.name },
        effectLabel: 'ЗАЩИТА',
        effectText: `${t.name} под защитой — для исключения нужно на 2+ голоса больше`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byBaggage(alive, ['семян','семена']));
      if (!t) return null;
      return {
        icon: '🌱', title: 'НУЛЕВЫЕ ЗАПАСЫ ЕДЫ',
        description: 'Консервы закончились. Единственный шанс — внутреннее сельское хозяйство. Семена стали главным активом.',
        hint: 'Тот, у кого есть семена, держит ключ к выживанию группы.',
        effect: { type: 'protect', targetId: t.id, targetName: t.name },
        effectLabel: 'ЗАЩИТА',
        effectText: `${t.name} под защитой — для исключения нужно на 2+ голоса больше`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byBaggage(alive, ['аптечка','медицин','инструмент']));
      if (!t) return null;
      return {
        icon: '💊', title: 'ДЕФИЦИТ МЕДИКАМЕНТОВ',
        description: 'Трое нуждаются в срочной помощи. Собственные запасы лекарств — на счету.',
        hint: 'Тот, кто принёс медицину, сейчас ценнее всех.',
        effect: { type: 'protect', targetId: t.id, targetName: t.name },
        effectLabel: 'ЗАЩИТА',
        effectText: `${t.name} под защитой — для исключения нужно на 2+ голоса больше`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byBaggage(alive, ['фильтр','очистки','воды']));
      if (!t) return null;
      return {
        icon: '💧', title: 'ЗАГРЯЗНЕНИЕ ВОДЫ',
        description: 'Анализ показал: вода в резервуарах заражена. Очистка — единственный вариант.',
        hint: 'Система очистки воды сейчас буквально спасает жизни.',
        effect: { type: 'protect', targetId: t.id, targetName: t.name },
        effectLabel: 'ЗАЩИТА',
        effectText: `${t.name} под защитой — для исключения нужно на 2+ голоса больше`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byHealth(alive, ['Абсолютно здоров','Спортивная','выносли','иммунитет']));
      if (!t) return null;
      return {
        icon: '💪', title: 'ТЯЖЁЛЫЕ ФИЗИЧЕСКИЕ РАБОТЫ',
        description: 'Требуется расчистить завал в тоннеле. Нагрузка критическая — слабым не справиться.',
        hint: 'Физически здоровые участники стали ключевым ресурсом.',
        effect: { type: 'protect', targetId: t.id, targetName: t.name },
        effectLabel: 'ЗАЩИТА',
        effectText: `${t.name} под защитой — для исключения нужно на 2+ голоса больше`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byFact(alive, ['Преппер','выживани','тайге','спецназ','армии']));
      if (!t) return null;
      return {
        icon: '🎒', title: 'КРИТИЧЕСКАЯ СИТУАЦИЯ',
        description: 'Внезапный прорыв наружного воздуха. Нужен человек, который готовился к подобному всю жизнь.',
        hint: 'Опыт выживания сейчас важнее образования.',
        effect: { type: 'protect', targetId: t.id, targetName: t.name },
        effectLabel: 'ЗАЩИТА',
        effectText: `${t.name} под защитой — для исключения нужно на 2+ голоса больше`,
      };
    },
  },

  // ── PENALTY (штраф) ───────────────────────────
  {
    try(alive) {
      const t = pick(byHealth(alive, ['Астма','Клаустрофобия','Диабет','Гипертония','Ослабленный','Депрессия']));
      if (!t) return null;
      return {
        icon: '⚠️', title: 'РЕСУРСЫ НА ИСХОДЕ',
        description: 'Группе предстоит долгий период жёстких ограничений. Каждый должен быть в состоянии обслуживать себя сам.',
        hint: 'Хронические заболевания в условиях дефицита — критический фактор.',
        effect: { type: 'penalty', targetId: t.id, targetName: t.name },
        effectLabel: 'УГРОЗА',
        effectText: `${t.name} в зоне риска — голоса против него считаются ×2`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byFact(alive, ['Трус','манипул','мошенничество','Судимость']));
      if (!t) return null;
      return {
        icon: '🗡️', title: 'ВНУТРЕННИЙ КОНФЛИКТ',
        description: 'В бункере выявлен источник дестабилизации. Группа не может функционировать при наличии токсичного элемента.',
        hint: 'Некоторые факты биографии несовместимы с выживанием в закрытой группе.',
        effect: { type: 'penalty', targetId: t.id, targetName: t.name },
        effectLabel: 'УГРОЗА',
        effectText: `${t.name} в зоне риска — голоса против него считаются ×2`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byBaggage(alive, ['фотоальбом','игрушки','Детские','золото']));
      if (!t) return null;
      return {
        icon: '🗑️', title: 'АУДИТ РЕСУРСОВ',
        description: 'Инвентаризация показала: некоторые предметы занимают место без практической пользы.',
        hint: 'В бункере нет места сентиментальности. Только польза.',
        effect: { type: 'penalty', targetId: t.id, targetName: t.name },
        effectLabel: 'УГРОЗА',
        effectText: `${t.name} в зоне риска — голоса против него считаются ×2`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byHealth(alive, ['Избыточный вес']));
      if (!t) return null;
      return {
        icon: '🏋️', title: 'ФИЗИЧЕСКИЕ НОРМАТИВЫ',
        description: 'Группа устанавливает минимальные физические нормы. Это не жестокость — это математика выживания.',
        hint: 'В условиях ограниченного питания физическое состояние — общее дело.',
        effect: { type: 'penalty', targetId: t.id, targetName: t.name },
        effectLabel: 'УГРОЗА',
        effectText: `${t.name} в зоне риска — голоса против него считаются ×2`,
      };
    },
  },

  // ── IMMUNITY (иммунитет) ──────────────────────
  {
    try(alive) {
      const t = pick(byFact(alive, ['армии','Спецназ','разведчик','боевые','дзюдо']));
      if (!t) return null;
      return {
        icon: '🛡️', title: 'ВНЕШНЯЯ УГРОЗА',
        description: 'Датчики зафиксировали движение снаружи. Нужен человек с боевым опытом.',
        hint: 'Этот раунд — не время голосовать против силы.',
        effect: { type: 'immunity', targetId: t.id, targetName: t.name },
        effectLabel: 'ИММУНИТЕТ',
        effectText: `${t.name} неприкосновенен этот раунд — голоса против не считаются`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byBiology(alive, ['Беременна','беременн']));
      if (!t) return null;
      return {
        icon: '👶', title: 'БУДУЩЕЕ ЧЕЛОВЕЧЕСТВА',
        description: 'Группа осознаёт: каждый новый человек — шанс на продолжение цивилизации.',
        hint: 'Некоторые вещи стоят выше правил голосования.',
        effect: { type: 'immunity', targetId: t.id, targetName: t.name },
        effectLabel: 'ИММУНИТЕТ',
        effectText: `${t.name} неприкосновенна этот раунд — голоса против не считаются`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byFact(alive, ['врач скорой','Доктор наук']));
      if (!t) return null;
      return {
        icon: '🩺', title: 'МЕДИЦИНСКИЙ КРИЗИС',
        description: 'Трое в критическом состоянии. Потерять опытного медика сейчас — значит потерять всех.',
        hint: 'Иногда один человек важнее правил демократии.',
        effect: { type: 'immunity', targetId: t.id, targetName: t.name },
        effectLabel: 'ИММУНИТЕТ',
        effectText: `${t.name} неприкосновенен этот раунд — голоса против не считаются`,
      };
    },
  },

  // ── EXPOSE (раскрытие карт) ───────────────────
  {
    try(alive) {
      // Кто скрывает больше всего карт
      const withHidden = alive.filter(p => Object.keys(p.openedCards || {}).length < 6);
      if (!withHidden.length) return null;
      const t = [...withHidden].sort(
        (a, b) => Object.keys(a.openedCards||{}).length - Object.keys(b.openedCards||{}).length
      )[0];
      return {
        icon: '🔎', title: 'ДОПРОС',
        description: 'Группа замечает: один из участников намеренно скрывает информацию. Доверие — основа выживания.',
        hint: 'Тот, кто прячет больше всех — обязан раскрыться.',
        effect: { type: 'expose', targetId: t.id, targetName: t.name },
        effectLabel: 'РАСКРЫТИЕ',
        effectText: `${t.name} обязан открыть все оставшиеся карты прямо сейчас`,
      };
    },
  },
  {
    try(alive) {
      const t = pick(byFact(alive, ['манипул','мошенничество','конспирац','Судимость']));
      if (!t) return null;
      return {
        icon: '🧪', title: 'СЫВОРОТКА ПРАВДЫ',
        description: 'Найдено вещество, вызывающее непреодолимое желание говорить правду.',
        hint: 'Некоторые факты биографии слишком важны, чтобы оставаться тайной.',
        effect: { type: 'expose', targetId: t.id, targetName: t.name },
        effectLabel: 'РАСКРЫТИЕ',
        effectText: `${t.name} обязан открыть все оставшиеся карты прямо сейчас`,
      };
    },
  },
];

const FALLBACKS = [
  {
    icon: '🌡️', title: 'ПЕРЕБОИ С ОТОПЛЕНИЕМ',
    description: 'Температура в бункере резко упала. Группе предстоит пережить несколько тяжёлых дней.',
    hint: 'Физически слабые участники под угрозой. Выносливые — в приоритете.',
    effect: { type: 'none' },
    effectLabel: 'ИСПЫТАНИЕ',
    effectText: 'Событие влияет на настроение группы, но не на механику голосования',
  },
  {
    icon: '📻', title: 'РАДИОСИГНАЛ',
    description: 'Поймали неизвестный сигнал. Возможно, есть другие выжившие. Нужен человек с техническими знаниями.',
    hint: 'Стоит ли устанавливать контакт или это ловушка?',
    effect: { type: 'none' },
    effectLabel: 'ДИЛЕММА',
    effectText: 'Событие не влияет на голосование — только на обсуждение',
  },
  {
    icon: '🔋', title: 'ДЕФИЦИТ ЭНЕРГИИ',
    description: 'Генератор работает на 30%. Придётся выбрать: свет или вентиляция.',
    hint: 'Кто умеет работать с электричеством — тот сейчас главный.',
    effect: { type: 'none' },
    effectLabel: 'КРИЗИС',
    effectText: 'Событие не влияет на голосование — только на обсуждение',
  },
];

function generateRoundEvent(alivePlayers) {
  const shuffled = [...TEMPLATES].sort(() => Math.random() - 0.5);
  for (const tpl of shuffled) {
    const event = tpl.try(alivePlayers);
    if (event) return event;
  }
  return pick(FALLBACKS);
}

module.exports = { generateRoundEvent };
