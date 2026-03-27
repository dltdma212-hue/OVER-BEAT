window.LEVELS = [
    // ── PHASE: ALPHA (I. 접속 및 동기화) ──
    {
        id: 1, phase: "ALPHA", phaseNum: "I", phaseTitle: "접속 및 동기화",
        title: "INITIAL SYNC", subTitle: "최초 동기화",
        bpm: 100, speed: 400, duration: 60, density: 4,
        msg: "INITIAL SYNC", videoId: "local", startSeconds: 0,
        metadata: "시스템 접속 및 기본 박자 적응"
    },
    {
        id: 2, phase: "ALPHA", phaseNum: "I", phaseTitle: "접속 및 동기화",
        title: "SIGNAL TRACE", subTitle: "신호 추적",
        bpm: 105, speed: 420, duration: 60, density: 4,
        msg: "SIGNAL TRACE", videoId: "local", startSeconds: 20,
        metadata: "비트의 흐름을 따라가는 단계"
    },
    {
        id: 3, phase: "ALPHA", phaseNum: "I", phaseTitle: "접속 및 동기화",
        title: "NEURAL LINK", subTitle: "신경 연결",
        bpm: 110, speed: 450, duration: 60, density: 4,
        msg: "NEURAL LINK", videoId: "local", startSeconds: 40,
        metadata: "유저와 음악의 일체화 시작",
        shakeView: true
    },
    {
        id: 4, phase: "ALPHA", phaseNum: "I", phaseTitle: "접속 및 동기화",
        title: "DATA INFILTRATION", subTitle: "데이터 침투",
        bpm: 115, speed: 480, duration: 60, density: 8,
        msg: "DATA INFILTRATION", videoId: "local", startSeconds: 60,
        metadata: "본격적인 비트 속으로의 진입",
        flipView: true
    },
    {
        id: 5, phase: "ALPHA", phaseNum: "I", phaseTitle: "접속 및 동기화",
        title: "FREQUENCY DRIFT", subTitle: "주파수 편차",
        bpm: 120, speed: 520, duration: 60, density: 8,
        msg: "FREQUENCY DRIFT", videoId: "local", startSeconds: 80,
        metadata: "엇박자가 조금씩 섞이기 시작함",
        fogView: true
    },

    // ── PHASE: BRAVO (II. 심층 해독) ──
    {
        id: 6, phase: "BRAVO", phaseNum: "II", phaseTitle: "심층 해독",
        title: "RHYTHM BREACH", subTitle: "리듬 돌파",
        bpm: 130, speed: 580, duration: 60, density: 8,
        msg: "RHYTHM BREACH", videoId: "local", startSeconds: 100,
        metadata: "빨라진 속도로 방어벽 돌파",
        flipView: true, fogView: true
    },
    {
        id: 7, phase: "BRAVO", phaseNum: "II", phaseTitle: "심층 해독",
        title: "SONIC LAYER", subTitle: "음파 레이어",
        bpm: 140, speed: 640, duration: 60, density: 8,
        msg: "SONIC LAYER", videoId: "local", startSeconds: 120,
        metadata: "여러 겹의 노트가 겹쳐서 출현",
        speedJitter: 0.1
    },
    {
        id: 8, phase: "BRAVO", phaseNum: "II", phaseTitle: "심층 해독",
        title: "PATTERN DECODING", subTitle: "패턴 해독",
        bpm: 155, speed: 700, duration: 60, density: 8,
        msg: "PATTERN DECODING", videoId: "local", startSeconds: 140,
        metadata: "복잡한 건반 패턴 분석 및 처리",
        shakeView: true, darknessView: true
    },
    {
        id: 9, phase: "BRAVO", phaseNum: "II", phaseTitle: "심층 해독",
        title: "SYSTEM OVERLOAD", subTitle: "시스템 과부하",
        bpm: 170, speed: 760, duration: 60, density: 16,
        msg: "SYSTEM OVERLOAD", videoId: "local", startSeconds: 160,
        metadata: "과부하가 걸릴 듯한 빠른 비트",
        speedJitter: 0.15, flipView: true
    },
    {
        id: 10, phase: "BRAVO", phaseNum: "II", phaseTitle: "심층 해독",
        title: "DEEP RESONANCE", subTitle: "심층 공명",
        bpm: 185, speed: 820, duration: 60, density: 16,
        msg: "DEEP RESONANCE", videoId: "local", startSeconds: 180,
        metadata: "음악과 완벽히 공명하는 시점",
        fogView: true, shakeView: true
    },

    // ── PHASE: OMEGA (III. 오버 비트) ──
    {
        id: 11, phase: "OMEGA", phaseNum: "III", phaseTitle: "오버 비트",
        title: "HARMONIC STRIKE", subTitle: "고조파 타격",
        bpm: 200, speed: 900, duration: 60, density: 16,
        msg: "HARMONIC STRIKE", videoId: "local", startSeconds: 200,
        metadata: "공격적이고 화려한 연타 구간",
        flipView: true, darknessView: true
    },
    {
        id: 12, phase: "OMEGA", phaseNum: "III", phaseTitle: "오버 비트",
        title: "KINETIC PULSE", subTitle: "운동 펄스",
        bpm: 215, speed: 980, duration: 60, density: 16,
        msg: "KINETIC PULSE", videoId: "local", startSeconds: 220,
        metadata: "몸이 먼저 반응하는 최고속 비트",
        speedJitter: 0.2, fogView: true
    },
    {
        id: 13, phase: "OMEGA", phaseNum: "III", phaseTitle: "오버 비트",
        title: "VELOCITY LIMIT", subTitle: "속도 한계",
        bpm: 230, speed: 1050, duration: 60, density: 32,
        msg: "VELOCITY LIMIT", videoId: "local", startSeconds: 240,
        metadata: "한계치까지 밀어붙이는 속도감",
        shakeView: true, flipView: true, darknessView: true
    },
    {
        id: 14, phase: "OMEGA", phaseNum: "III", phaseTitle: "오버 비트",
        title: "FINAL ENCRYPTION", subTitle: "최종 암호화",
        bpm: 245, speed: 1150, duration: 60, density: 32,
        msg: "FINAL ENCRYPTION", videoId: "local", startSeconds: 260,
        metadata: "마지막 관문을 향한 복합 패턴",
        speedJitter: 0.25, fogView: true
    },
    {
        id: 15, phase: "OMEGA", phaseNum: "III", phaseTitle: "오버 비트",
        title: "OVER-BEAT : THE END", subTitle: "최종 작전",
        bpm: 260, speed: 1300, duration: 60, density: 32,
        msg: "OVER-BEAT : THE END", videoId: "local", startSeconds: 280,
        metadata: "모든 비트를 압도하는 최종 작전",
        speedJitter: 0.35, flipView: true, fogView: true, shakeView: true, darknessView: true
    }
];
