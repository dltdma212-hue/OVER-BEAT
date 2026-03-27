# 🚀 구글 드라이브 비디오 수신 서버 설정 가이드 (Google Apps Script)

유저들의 녹화된 게임 웹엠(WebM) 비디오 파일을 세진 님의 구글 드라이브로 자동으로 전송받으려면 아래 순서대로 앱스 스크립트를 서버로 세팅해야 합니다!

## 1. 스크립트 프로젝트 생성
1. 구글 드라이브(https://drive.google.com/)에 접속하여 로그인합니다.
2. 좌측 상단 [ + 새로 만들기 ] -> [ 더보기 ] -> **[ Google Apps Script ]** 를 클릭합니다.
3. 열린 에디터 창의 기존에 적혀있는 내용을 모두 지우고, 아래의 코드를 복사해서 붙여넣습니다.

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var base64data = data.data;
    var fileName = data.fileName;
    var mimeType = data.mimeType;

    // base64 데이터를 파일(Blob) 형태로 디코딩
    var blob = Utilities.newBlob(Utilities.base64Decode(base64data), mimeType, fileName);
    
    // 내 구글 드라이브(최상위 루트)에 파일 생성
    var file = DriveApp.createFile(blob);
    
    // 성공 시 파일 주소 반환
    return ContentService.createTextOutput("Success: " + file.getUrl())
                         .setMimeType(ContentService.MimeType.TEXT);
  } catch(err) {
    return ContentService.createTextOutput("Error: " + err.toString())
                         .setMimeType(ContentService.MimeType.TEXT);
  }
}
```

## 2. 웹 앱(Web App)으로 배포하기
1. 붙여넣기 후 상단의 플로피디스크 아이콘(💾)을 눌러 프로젝트를 **저장**합니다. (이름은 'KODARI_REC_SERVER' 등으로 자유롭게 지어주세요)
2. 우측 상단의 파란색 **[ 배포 ] (Deploy)** 버튼 -> **[ 새 배포 ] (New deployment)** 를 클릭합니다.
3. 톱니바퀴 마크(유형 선택)를 누르고 **[ 웹 앱 ] (Web app)** 을 선택합니다.
4. 설정값 변경 (중요):
   - 실행 주체 (Execute as): **'나(Me)'** (세진님의 계정 이메일)
   - 액세스 권한이 있는 사용자 (Who has access): **'모든 사용자(Anyone)'**
5. **[ 배포 ] (Deploy)** 버튼을 누릅니다.
6. (최초 실행 시) '액세스 승인' 버튼이 뜹니다. 본인 계정을 선택 -> 고급 -> ~로 이동(안전하지 않음) -> '허용'을 눌러 드라이브 쓰기 권한을 승인합니다.

## 3. 웹 앱 URL 복사해서 게임 엔진에 넣기
1. 배포가 끝나면 긴 **'웹 앱 URL' (https://script.google.com/macros/s/.../exec)** 이 나옵니다. 이 주소를 [복사]합니다.
2. 세진 님의 노트북에 생성된 `auto_recorder.js` 파일의 6번째 줄을 엽니다.
   ```javascript
   const GAS_UPLOAD_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
   ```
3. "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE" 부분을 지우고 좀 전에 복사한 주소를 큰 따옴표 안에 붙여넣고 저장합니다.

## 🎉 설정 끝!
이제 구글 드라이브로 비디오 파일들이 KODARI_AGENT_시간.webm 이름으로 자동으로 업로드됩니다! 
