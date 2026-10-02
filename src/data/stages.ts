export interface StageData {
  id: number;
  stageNumber: number;
  roomName: string;
  title: string;
  story: string;
  question: string;
  expression: string;
  num1: string;
  num2: string;
  operator: '+' | '-';
  answer: string;
  unit?: string;
  conceptTip: string;
  badge: string;
  clueItemName: string;
}

export const STAGES: StageData[] = [
  {
    id: 1,
    stageNumber: 1,
    roomName: "셜록의 서재",
    title: "서재의 첫 번째 서랍 자물쇠",
    story: "명탐정 홈즈의 서재에 갇혔습니다! 책상 위의 첫 번째 서랍을 열기 위한 3자리 다이얼 자물쇠가 걸려 있습니다. 돋보기로 보니 쪽지에 암호식이 적혀 있습니다.",
    question: "소수점 위치를 맞춰 0.34와 0.45를 더한 값을 자물쇠에 입력하세요.",
    expression: "0.34 + 0.45",
    num1: "0.34",
    num2: "0.45",
    operator: "+",
    answer: "0.79",
    conceptTip: "소수점(.)의 자리를 세로로 똑같이 맞추고, 소수 둘째 자리(4+5), 소수 첫째 자리(3+4)를 차례대로 더해보세요.",
    badge: "돋보기 뱃지",
    clueItemName: "황금 열쇠 조각 1"
  },
  {
    id: 2,
    stageNumber: 2,
    roomName: "벽난로 비밀 통로",
    title: "벽난로 뒤 비밀 금고의 회전판",
    story: "서랍 안에서 얻은 열쇠로 벽난로 뒤편을 열자 육중한 쇠금고가 나타났습니다! 붉은 숯불 빛 속에서 받아올림이 숨어 있는 소수의 덧셈 암호가 빛나고 있습니다.",
    question: "1.68과 2.54를 더하여 금고의 비밀번호를 해독하세요.",
    expression: "1.68 + 2.54",
    num1: "1.68",
    num2: "2.54",
    operator: "+",
    answer: "4.22",
    conceptTip: "소수 둘째 자리(8+4=12)에서 1을 올리고, 소수 첫째 자리(6+5+1=12)에서 1을 자연수 자리로 올려주세요.",
    badge: "비밀 금고 열쇠",
    clueItemName: "특수 톱니바퀴"
  },
  {
    id: 3,
    stageNumber: 3,
    roomName: "비밀 서가",
    title: "낡은 백과사전의 보석 상자",
    story: "두꺼운 백과사전 사이에서 찰칵 소리가 나며 작은 상자가 튀어나왔습니다! 두 수의 자릿수가 서로 다릅니다. 당황하지 않고 소수점을 맞출 수 있을까요?",
    question: "3.5와 0.28을 더하여 보석 상자의 잠금을 해제하세요.",
    expression: "3.5 + 0.28",
    num1: "3.5",
    num2: "0.28",
    operator: "+",
    answer: "3.78",
    conceptTip: "3.5의 소수 둘째 자리에 0이 숨어 있다고 생각하면 '3.50 + 0.28'로 소수점 줄이 딱 맞아떨어져요!",
    badge: "지혜의 책갈피",
    clueItemName: "수정 렌즈"
  },
  {
    id: 4,
    stageNumber: 4,
    roomName: "시계탑 기계실",
    title: "괘종시계의 톱니바퀴 잠금장치",
    story: "째깍째깍! 거대한 괘종시계의 바늘이 정신없이 돌고 있습니다. 다음 방 문을 열려면 톱니바퀴에 적힌 소수의 뺄셈 암호를 풀어야 합니다.",
    question: "5.42에서 2.18을 뺀 값을 입력하여 톱니바퀴를 멈추세요.",
    expression: "5.42 - 2.18",
    num1: "5.42",
    num2: "2.18",
    operator: "-",
    answer: "3.24",
    conceptTip: "소수 둘째 자리 2에서 8을 뺄 수 없으니, 소수 첫째 자리 4에서 1을 받아내림(빌려오기) 하여 12 - 8 = 4로 계산하세요.",
    badge: "시간의 태엽",
    clueItemName: "청동 열쇠"
  },
  {
    id: 5,
    stageNumber: 5,
    roomName: "비밀 화학 실험실",
    title: "실험실 약품 선반의 정밀 저울",
    story: "탈출 문을 열기 위한 특수 시약을 조합해야 합니다. 정밀 저울 위에 자연수 4에서 소수 1.65를 뺀 양만큼만 시약을 부어야 문이 열립니다!",
    question: "4 - 1.65의 계산 결과를 입력하여 시약의 무게를 맞추세요.",
    expression: "4 - 1.65",
    num1: "4",
    num2: "1.65",
    operator: "-",
    answer: "2.35",
    conceptTip: "자연수 4는 '4.00'과 같아요! 4.00 - 1.65로 세로셈을 정렬하여 차근차근 받아내림을 해보세요.",
    badge: "화학자의 시약병",
    clueItemName: "최종 출구 마스터키"
  },
  {
    id: 6,
    stageNumber: 6,
    roomName: "최종 출구 게이트",
    title: "최후의 탈출 문: 명탐정 암호 해독기",
    story: "드디어 마지막 문 앞에 도달했습니다! 문 중앙에 대형 암호 해독기가 장착되어 있습니다. 탐정 수첩에 기록된 사건 단서의 무게를 합산하여 최종 탈출 코드를 입력하세요!",
    question: "단서 A의 무게는 2.75kg이고, 단서 B는 A보다 1.48kg 더 가볍습니다. 단서 A와 단서 B의 무게의 합은 총 몇 kg일까요? (숫자만 입력)",
    expression: "2.75 + (2.75 - 1.48)",
    num1: "2.75",
    num2: "1.27",
    operator: "+",
    answer: "4.02",
    unit: "kg",
    conceptTip: "1단계로 단서 B의 무게를 구합니다: 2.75 - 1.48 = 1.27kg. 2단계로 단서 A(2.75)와 단서 B(1.27)를 더해보세요!",
    badge: "명탐정 명예 훈장",
    clueItemName: "방탈출 성공 트로피"
  }
];
