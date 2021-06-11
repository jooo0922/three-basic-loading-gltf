'use strict';

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

import {
  OrbitControls
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';

import {
  GLTFLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/GLTFLoader.js';

import {
  GUI
} from 'https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js';


function main() {
  // create WebGLRenderer
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas
  });
  renderer.shadowMap.enabled = true; // renderer의 그림자 설정을 켜줌.

  // create camera
  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 10, 20);

  // create OrbitControls
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0); // OrbitControls로 컨트롤하는 카메라의 시선이 (0, 5, 0)지점에 고정될거임
  controls.update();

  // create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#DEFEFF'); // 씬의 배경색은 옅은 하늘색으로 지정함.

  // 평면 지오메트리를 만들어서 바닥 역할을 할 메쉬를 생성해 줌.
  {
    const planeSize = 40;

    // 텍스처를 로드하고 생성함
    const loader = new THREE.TextureLoader();
    const texture = loader.load('./image/checker.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping; // 텍스쳐의 수평, 수직 방향의 래핑 유형을 '반복'으로 지정함.
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats); // 수평, 수직 방향의 반복횟수를 각각 20회로 지정함. 왜? 원본의 가로세로가 2*2인데 생성할 메쉬의 사이즈가 40*40이니까 가로, 세로방향으로 각각 20번 반복해서 들어가면 딱 맞지

    // 평면 지오메트리를 생성하고 바닥 메쉬를 만듦
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide, // 바닥 메쉬의 양면을 모두 렌더링처리 하도록 지정함.
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5; // 메쉬는 항상 XY축을 기준으로 생성되므로 XZ축을 기준으로 생성하려면 메쉬를 X축을 기준으로 -90도 회전시켜야 함.
    scene.add(mesh);
  }

  // HemisphereLight(반구광) 생성
  {
    const skyColor = 0xB1E1FF; // light blue
    const groundColor = 0xB97A20 // brownish orange
    const intensity = 1;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
  }

  // DirectionalLight(직사광) 생성
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.castShadow = true; // 직사광에 의해 그림자가 드리울 수 있도록 설정함.
    light.position.set(-250, 800, -850);
    light.target.position.set(-550, 40, -450); // 가져온 모델링 요소의 규모에 맞게 light과 light.target의 위치값을 재조정함

    // 표면에 그림자 처리를 해줄 지 말지를 결정하는 깊이값(기본값 0). 0.0001의 단위로 미세하게 더하거나 빼주면 그림자의 인공적인 느낌을 줄일 수 있다고 함.
    light.shadow.bias = -0.004;
    // 로드해 온 모델의 사이즈가 크기 때문에, 그것이 만들어내는 그림자를 담는 그림자용 카메라의 공간이 커질거임. 그에 따라 그림자 맵의 해상도도 커져야 그림자의 해상도도 각지는 느낌 없이 부드럽게 렌더될거임.
    // 다만 주의할 건, 그림자용 카메라의 사이즈와 그림자맵의 해상도는 커지면 커질수록 메모리를 많이 차지하고 연산이 더 복잡해지므로, 가능한 작게 설정하는 게 좋기는 함.
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;

    scene.add(light);
    scene.add(light.target); // DirectionalLight.target의 기본 위치값은 (0, 0, 0)임. 따라서 이를 별도로 지정해주지 않고 scene에 추가했다면, directionalLight은 원점을 향하겠지.

    // directional light가 만들어내는 그림자를 담아낼 그림자용 카메라를 생성해야 함.
    // 이때, 모델이 크기 때문에 담아내는 그림자용 카메라의 절두체도 커져야하는데, directional light는 그림자용 카메라로 Orthographic camera를 사용한다는 점!
    const cam = light.shadow.camera;
    cam.near = 1;
    cam.far = 2000;
    cam.left = -1500;
    cam.right = 1500;
    cam.top = 1500;
    cam.bottom = -1500;

    // 그림자용 카메라를 시각화해줄 카메라 헬퍼 생성
    const cameraHelper = new THREE.CameraHelper(cam);
    scene.add(cameraHelper);
    cameraHelper.visible = false; // 그렇지만 보이게 하지는 않음..
    // Directional light을 시각화해줄 directionalLightHelper도 생성
    const helper = new THREE.DirectionalLightHelper(light, 100); // 뒤에 전달한 100은 직사광을 시각화했을 때 광원 지점에 그려지는 직사각형의 평면 사이즈를 결정해주는 값.
    scene.add(helper);
    helper.visible = false; // 마찬가지로 보이게 하지는 않음..

    // Vector3값(여기서는 light.position, light.target.position)을 받아서 각 x, y, z값을 입력받는 gui를 만드는 함수
    function makeXYZGUI(gui, vector3, name, onChangeFn) {
      const folder = gui.addFolder(name);
      folder.add(vector3, 'x', vector3.x - 500, vector3.x + 500).onChange(onChangeFn);
      folder.add(vector3, 'y', vector3.y - 500, vector3.y + 500).onChange(onChangeFn);
      folder.add(vector3, 'z', vector3.z - 500, vector3.z + 500).onChange(onChangeFn);
      folder.open();
    }

    // light, light.target, 조명 헬퍼, 그림자용 카메라, 그림자용 카메라 헬퍼 등의 값이 변할 때 일괄적으로 update 메서드를 호출해주는 함수
    function updateCamera() {
      light.updateMatrixWorld();
      light.target.updateMatrixWorld();
      helper.update();
      light.shadow.camera.updateProjectionMatrix();
      cameraHelper.update();
    }
    updateCamera(); // 맨 처음에 호출 한 번 해주고

    // 아래에 사용되는 헬퍼 클래스들은 directional_light_shadow 에 작성한 코드에서 내용을 정리해놨으니 참고하면 될 듯.

    // dat.GUI에서 값을 임력받으면 directional light의 그림자용 카메라는 orthographic camera를 사용하니까
    // 해당 정사영 카메라의 left, right값을 각각 -2, 2로 나누어서 할당해주는 헬퍼 클래스를 만든 것. (top, bottom도 동일)
    class DimensionGUIHelper {
      constructor(obj, minProp, maxProp) {
        this.obj = obj;
        this.minProp = minProp;
        this.maxProp = maxProp;
      }
      get value() {
        // setter에서 입력받은 value를 2로 나눠서 this.maxProp에 넣어줬으니, 
        // getter에서는 이걸 다시 꺼내와서 2를 곱해서 원래의 입력받은 value로 원상복구되겠지.
        // 원상복구된 value를 gui에 리턴해줘야 gui의 입력폼에도 변화된 상태값이 반영되겠지. 
        return this.obj[this.maxProp] * 2;
      }
      set value(v) {
        this.obj[this.maxProp] = v / 2;
        this.obj[this.minProp] = v / -2;
      }
    }

    // dat.GUI에서 값을 입력받아 그림자용 카메라의 near, far값을 조절하는 헬퍼 클래스 (카메라 챕터에서 사용했던 클래스를 가져온거임.)
    class MinMaxGUIHelper {
      constructor(obj, minProp, maxProp, minDif) {
        this.obj = obj;
        this.minProp = minProp;
        this.maxProp = maxProp;
        this.minDif = minDif;
      }
      get min() {
        return this.obj[this.minProp];
      }
      set min(v) {
        this.obj[this.minProp] = v;
        this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
      }
      get max() {
        return this.obj[this.maxProp];
      }
      set max(v) {
        this.obj[this.maxProp] = v;
        this.min = this.min; // this will call the min setter
      }
    }

    // 헬퍼 객체들을 받아온 뒤 this.objects 배열에 저장하여 forEach 반복문을 돌려 입력받은 'value' 값을 각각의 헬퍼의 visible 속성에 할당해주는 헬퍼 클래스
    class VisibleGUIHelper {
      constructor(...objects) {
        this.objects = [...objects];
      }
      get value() {
        return this.objects[0].visible; // 얘는 첫번째 헬퍼 객체(즉, helper)의 바뀐 visible값만 가져와서 그 상태값을 gui에 반영하려고 gui에 리턴해주는 값
      }
      set value(v) {
        this.objects.forEach((obj) => {
          obj.visible = v;
        });
      }
    }

    const gui = new GUI(); // GUI 인스턴스 생성
    gui.close(); // 맨 처음 코드를 실행하면 기본적으로 gui는 닫혀있는 상태로 보일거임
    gui.add(new VisibleGUIHelper(helper, cameraHelper), 'value').name('show helpers');
    gui.add(light.shadow, 'bias', -0.1, 0.1, 0.001); // bias값은 -0.1 ~ 0.1 사이의 값을 0.001 단위로 입력받을 수 있도록 하는 입력창 추가함.
    {
      // 이 block 안에서는 그림자용 카메라에 대한 값에 관한 입력창들을 생성하여 폴더에 묶어둘거임
      const folder = gui.addFolder('Shadow Camera');
      folder.open();
      folder.add(new DimensionGUIHelper(light.shadow.camera, 'left', 'right'), 'value', 1, 4000).name('width').onChange(updateCamera);
      folder.add(new DimensionGUIHelper(light.shadow.camera, 'bottom', 'top'), 'value', 1, 4000).name('height').onChange(updateCamera);
      const minMaxGUIHelper = new MinMaxGUIHelper(light.shadow.camera, 'near', 'far', 0.1);
      folder.add(minMaxGUIHelper, 'min', 1, 1000, 1).name('near').onChange(updateCamera);
      folder.add(minMaxGUIHelper, 'max', 1, 4000, 1).name('far').onChange(updateCamera);
      folder.add(light.shadow.camera, 'zoom', 0.01, 1.5, 0.01).onChange(updateCamera); // 그림자용 카메라인 OrthographicCamera의 zoom 속성값을 0.01 ~ 1.5 사이에서 0.01 단위의 값으로 입력받는 입력창을 추가해 줌.
    }

    // light.position, light.target.position 각각의 Vector3 값을 넘겨줘서 각 Vector3의 x, y, z값을 입력받는 입력창들을 폴더로 묶어서 만들어주는 함수 
    makeXYZGUI(gui, light.position, 'position', updateCamera);
    makeXYZGUI(gui, light.target.position, 'target', updateCamera);

    // 전체적으로 각 gui 입력창들은 입력값에 의해서 변화가 생기면 onChange 메서드에서 updateCamera를 호출시켜서 일괄적으로 조명, 그림자용 카메라, 각각의 헬퍼 등에 관해서 업데이트 해줌. 
  }

  // 직각삼각형에서 tan(angle) = 높이 / 밑변 공식을 활용해서 밑변 = 높이 / tan(angle)로 육면체가 카메라의 절두체 안으로 들어올 수 있는 육면체 ~ 카메라 사이의 거리값을 구하는 함수
  function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5; // 카메라 절두체 화면크기의 절반값. 직각삼각형에서 높이에 해당.
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5); // 현재 카메라의 시야각(fov)값의 절반값. tan() 메서드에 할당할 각도값. fov는 항상 degree 단위로 계산되기 때문에 tan 메서드에 넣어주려면 radian 단위로 변환해줘야 함.
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY); // 카메라와 육면체 사이의 거리값. 탄젠트값으로 직각삼각형의 밑변의 길이를 구하는 공식을 정리한 것. 


    // 카메라의 초기 위치값 ~ 육면체 중심점까지의 벡터값을 방향값만 갖는 단위벡터로 변환함. 이 때, 해당 벡터의 y값은 0으로 초기화하여 XZ축에 평행한 벡터를 만듦.
    const direction = (new THREE.Vector3()).subVectors(camera.position, boxCenter).multiply(new THREE.Vector3(1, 0, 1)).normalize();

    // 방향벡터에 distance를 곱한 벡터값을 bounding box의 중심점에서 더해주면 distance만큼 떨어지고, 방향벡터의 방향으로 떨어진 카메라의 위치값이 나옴. 이 Vector3값을 camera.position에 복사하여 넣어줌.
    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

    // 절두체의 near를 boxSize 길이의 0.01배, far를 boxSize 길이의 100배로 지정해주면, 해당 절두체 안에 bounding box가 충분히 들어가고도 남을 사이즈가 되겠지
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    // 카메라의 near, far값을 바꿔줬으니 업데이트 메서드를 호출해줘야 함
    camera.updateProjectionMatrix();

    // 카메라가 bounding box의 중심점을 바라보도록 해야 함.
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
  }

  // 자동차 객체 경로 곡선을 만들어놨더니 너무 사이즈가 작더라. 알고보니 디자이너가 Cars 부모 노드의 스케일값을 건드린 것 같다고 함.
  // 이처럼 blender같은 모델링 툴에서 작업할 때 scale같은 값을 건드리지 말고 직접 크기를 수정해야 한다고 함.. 나도 수정해야 할 거 같은데ㅜㅜ
  // 이거를 확인하기 위해서 각 노드들의 position, rotation, scale값(즉, Vector3값)을 받아와서 소수점 세번째 자리수까지 표현해주는 함수를 만듦.
  function dumpVec3(v3, precision = 3) {
    // 참고로 Number.toFixed(n)은 소수점 n번째 자리까지 표기한 값을 반환해주는거 알고 있지
    return `${v3.x.toFixed(precision)}, ${v3.y.toFixed(precision)}, ${v3.z.toFixed(precision)}`;
  }

  // gltf.scene 안에 들어있는 씬 그래프를 콘솔로 출력해주는 함수
  function dumpObject(obj, lines = [], isLast = true, prefix = '') {
    const localPrefix = isLast ? '└─' : '├─';
    lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`); // 참고로 ''(empty string)도 false value

    // 얘는 씬 그래프의 각 노드들의 position, rotation, scale값 앞에 붙여줄 dataPrefix를 뭘로 해줄지 정의해 줌.
    const dataPrefix = obj.children.length ? (isLast ? '  | ' : '| | ') : (isLast ? '    ' : '|   ');
    lines.push(`${prefix}${dataPrefix}  pos: ${dumpVec3(obj.position)}`);
    lines.push(`${prefix}${dataPrefix}  rot: ${dumpVec3(obj.rotation)}`);
    lines.push(`${prefix}${dataPrefix}  scl: ${dumpVec3(obj.scale)}`);

    const newPrefix = prefix + (isLast ? '  ' : '| '); // 내부 forEach 문의 다음 반복문에서 dumpObject를 호출할 때 넘겨줄 새로운 prefix값
    const lastIndex = obj.children.length - 1; // 현재 obj의 자식노드의 개수와 동일함.

    // forEach 반복문에서 dumpObject를 스스로 반복 호출하면서 최상위 노드인 gltf.scene의 각각의 자식노드들을 계속 obj값으로 전달해주는 것
    // 그럼 그 자식노드들은 또 dumpObject를 내부에서 forEach로 반복해서 돌리면서 각각의 자식노드들의 각각의 자식노드들을 계속 obj로 전달해줌.
    // 씬 그래프의 각각의 노드 계층 구조를 표현하는 string이 lines에 계속 push되고 있겠지?
    obj.children.forEach((child, index) => {
      // 그니까 현재 forEach를 돌려주고 있는 obj 노드의 자식노드들을 전부 다 돌아야, 즉 마지막 반복문이 되어야 isLast를 true로 전달해준다는 뜻
      const isLast = index === lastIndex;
      dumpObject(child, lines, isLast, newPrefix);
    });

    return lines;
  }

  // CatmullRomCurve3 클래스를 이용해서 각각의 자동차 객체가 움직일 3D 곡선 경로를 만듦
  let curve; // CatmullRomCurve3 객체를 만들어서 담아놓을 변수
  let curveObject; // CatmullRomCurve3로 만든 곡선으로 지오메트리를 생성하여 line 객체를 만들어 담아놓을 변수
  // 첫 번째 block에서는 CatmullRomCurve3를 이용하여 3D 곡선을 만듦
  {
    // 이 vertex data 배열은 튜토리얼 글쓴이가 블렌더에서 직접 만든 NURBS 곡선을 .obj 파일로 export해서 나온 정점 데이터 결과를 배열로 바꿔 사용한거임.
    const controlPoints = [
      [1.118281, 5.115846, -3.681386],
      [3.948875, 5.115846, -3.641834],
      [3.960072, 5.115846, -0.240352],
      [3.985447, 5.115846, 4.585005],
      [-3.793631, 5.115846, 4.585006],
      [-3.826839, 5.115846, -14.736200],
      [-14.542292, 5.115846, -14.765865],
      [-14.520929, 5.115846, -3.627002],
      [-5.452815, 5.115846, -3.634418],
      [-5.467251, 5.115846, 4.549161],
      [-13.266233, 5.115846, 4.567083],
      [-13.250067, 5.115846, -13.499271],
      [4.081842, 5.115846, -13.435463],
      [4.125436, 5.115846, -5.334928],
      [-14.521364, 5.115846, -5.239871],
      [-14.510466, 5.115846, 5.486727],
      [5.745666, 5.115846, 5.510492],
      [5.787942, 5.115846, -14.728308],
      [-5.423720, 5.115846, -14.761919],
      [-5.373599, 5.115846, -3.704133],
      [1.004861, 5.115846, -3.641834],
    ];

    /**
     * 위의 정점 데이터를 이용해서 3D 곡선을 만들건데, 일단 전략은 다음과 같음.
     * 
     * CatmullRomCurve3는 각 정점을 지나는 부드러운 곡선 (3D spline curve)를 만들어 주기 때문에 이 클래스를 이용할거임.
     * CatmullRomCurve3(points, closed) 두 가지 인자를 넘겨줄건데, 첫 번째 points는 정점 데이터 Vector3 객체들이 담긴 배열을 의미하고, 
     * closed는 해당 곡선을 닫아줄 것인지 열어둘 것인지 결정함. 우리는 true를 설정해서 닫힌 곡선을 만들거임. 그래야 자동차 객체들이 해당 곡선을 반복적으로 돌 수 있겠지
     * 
     * 각 정점의 현재 정점과 다음 정점 사이의 10% 지점, 90% 지점에 해당하는 Vector3를 추가로 만들어서 넘겨주면
     * 모서리가 좀 더 각지고 깔끔한 곡선이 나오게 됨. 그래서 해당 Vector3들도 각 정점마다 추가로 만들어서 곡선을 만들어줄거임.
     */
    const p0 = new THREE.Vector3(); // 현재 정점 데이터
    const p1 = new THREE.Vector3(); // 다음 정점 데이터
    curve = new THREE.CatmullRomCurve3(
      // controlPoints 배열 안에 각각의 정점 데이터들로부터 10% 지점, 90% 지점의 Vector3 값들을 구한 뒤, 현재 정점 데이터, 10% 지점 데이터, 90% 지점 데이터를 하나의 배열로 묶어서 
      // 그 배열로 매핑한 새로운 배열을 리턴해서 전달해줄거임.
      controlPoints.map((p, index) => {
        p0.set(...p); // 현재 p요소 배열에 존재하는 값들을 하나하나 복사해서 현재 정점 데이터 Vector3의 x, y, z에 지정해 줌.
        p1.set(...controlPoints[(index + 1) % controlPoints.length]); // 다음 p요소 배열에 존재하는 값들을 하나하나 복사해서 다음 정점 데이터 Vector3의 x, y, z에 지정해 줌.
        // 근데 인덱스값을 controlPoints.length로 나눈 값의 나머지로 계산해주는 이유가 뭘까? 이거는 마지막 인덱스인 20번째 인덱스의 다음 인덱스를 0번 인덱스로 구해주려는거임. 왜? (20 + 1) % 21 은 0으로 나올테니까.

        // 현재 정점 데이터, 현재 ~ 다음의 10% 지점 정점 데이터, 현재 ~ 다음의 90% 지점 정점 데이터를 배열로 묶어서 리턴해 줌.
        return [
          (new THREE.Vector3()).copy(p0), // 현재 정점 데이터 p0의 Vector3 좌표값을 복사해서 새로운 Vector3 좌표값에 넣어줌.
          (new THREE.Vector3()).lerpVectors(p0, p1, 0.1), // lerpVector(v1, v2, alpha)이거는 뭔지 알겠지? v1 ~ v2 사이의 벡터값을 alpha값을 이용해서 선형 보간법으로 계산해주는거. 여기는 10% 지점 정점 데이터
          (new THREE.Vector3()).lerpVectors(p0, p1, 0.9) // 여기는 현재 정점 데이터와 다음 정점 데이터의 90% 지점 정점 데이터
        ];
      }).flat(), // Array.flat()은 Array안에 저장된 또 다른 배열들(즉, 배열 속 배열)을 이어붙여주는 거라고 보면 됨. 인자로 depth, 즉 어느 깊이의 배열까지 이어붙여줄 것인지를 전달하는데, 기본값이 1이므로,
      // 별다른 값을 전달해주지 않는다면 1단계, 즉 배열속의 배열까지만 이어붙여주겠지. 지금 mapping으로 리턴받는 값들이 배열 형태로 묶여있으니까, 걔내들을 하나의 배열로 이어붙여준다는 거임.
      true // 닫힌 곡선으로 만든다는 거.
    );
  }

  // 두 번쨰 block에서는 첫 번째 block에서 만든 곡선으로 line 객체를 만들어서 씬에 추가해 시각화할거임.
  {
    // Curve.getPoints(division)은 곡선 객체를 division 만큼 쪼개어 준 뒤, getPoint(t) 메서드를 사용하여 division + 1 개의 정점 데이터 배열을 반환함.
    // 그니까 위에서 만든 곡선을 250개로 쪼개서 251개의 정점 데이터 좌표값들이 담긴 배열로 리턴해준다는 뜻.
    const points = curve.getPoints(250);
    // BufferGeometry.setFromPoints(points)는 해당 BufferGeometry의 attribute를 전달받은 정점 데이터 배열로 설정해준다는 뜻.
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xff0000
    }); // 보통 line 이나 lineSegments 같은 객체를 생성할 때 사용하는 머티리얼. 예전에 사용해봤으니 알거임.
    curveObject = new THREE.Line(geometry, material);

    // 디자이너가 Cars의 스케일을 잘못 건드려서 곡선 객체가 작게 보이는건데, 이럴 경우 씬 그래프의 자식노드들을 다 가져와서 scene에 넣어주거나 전체적인 트리구조를 수정해주는 게 이상적이지만
    // 튜토리얼 웹사이트에서는 곡선 자체의 크기를 키우는 게 가장 빠른 해결책이라고 해서 그렇게 하기로 함.
    curveObject.scale.set(100, 100, 100) // curve 객체 자체의 크기를 100배로 키움
    curveObject.position.y = -621;
    curveObject.visible = false; // 그리고 나서 곡선을 y축의 아래쪽에 배치하고 visible을 false로 해서 렌더되지 않도록 숨겨 둠.

    // 위에까지 작성하고 실행하면 curveObject가 안보였음.
    // 그래서 어디에 있는지 확인하고자 현재 material의 depthTest 값을 꺼놓음. 
    // 참고로 depthTest는 픽셀과 카메라의 거리값에 따라 렌더해줄지 말지를 결정함. 근데 지금 일단 어디에 가려서 안보이는지, 크기에 문제가 있는건지도 모르니까 이거를 꺼줘서 일단 무조건 보이게 해야함.
    material.depthTest = false;
    // 또 Object3D의 renderOrder를 1로 설정하면 가장 나중에 렌더되게 해서 무조건 보이게 하는거임. 왜냐면 나머지 요소들은 renderOrder의 기본값이 0일테니 1로 지정하면 가장 나중에 그려질거임
    curveObject.renderOrder = 1;

    scene.add(curveObject);
  }

  // let cars; // gltf.scene의 자식노드들 중 모든 자동차 객체들의 부모노드인 Cars를 할당해줄 변수.
  const cars = []; // 각각의 car 객체를 감싸는 부모노드인 obj들을 넣어줄 빈 배열
  // GLTFLoader를 생성하여 gltf 파일을 로드해온 뒤, scene 객체의 bounding box의 사이즈와 중심점을 구해서 카메라 절두체 사이즈와 카메라 ~ 중심점 사이의 거리를 구해주는 frameArea 함수를 호출함. 
  {
    const gltfLoader = new GLTFLoader();
    /**
     * GLTFLoader.load(url, onLoadFn)
     * 
     * GLTFLoader.load 메서드도 다른 Loader들처럼 onLoad 콜백함수를 인자로 전달할 수 있는데,
     * 이 콜백함수에 들어가는 인자는 gltf에 정의된 씬그래프 요소들(씬, 카메라, 애니메이션, 에셋 등등)이 JSON 오브젝트로 묶여서 전달됨.
     * 
     * 참고로 gltf 파일은 JSON 형식으로 제공됨과 동시에 추가 이진데이터(.bin), 텍스처(.jpg, .png)들이 외부 파일에 함께 저장됨.
     */
    gltfLoader.load('./models/cartoon_lowpoly_small_city_free_pack/scene.gltf', (gltf) => {
      const root = gltf.scene; // JSON 데이터 안에서도 씬그래프의 최상위 노드에 해당하는 scene 객체만 root에 할당한 뒤, 얘의 bounding box를 구해서 절두체와 카메라 거리값 등을 구해줄거임.
      scene.add(root); // 일단 씬에 추가해 줌.
      // '\n'은 new line seperator 즉, 리턴받은 lines안에 있는 string들을 줄바꿈 구분자로 합쳐줘서 하나의 문자열로 콘솔에 찍어줌
      // console.log(dumpObject(root).join('\n'));

      // Object3D.traverse(callbackFn) 이 메서드는 해당 Object3D를 포함한 그것의 모든 하위 요소들에 대해 인자로 전달한 콜백함수를 실행해 줌. 콜백함수는 매번 Object3D 포함 하위요소들을 인자로 전달받음
      root.traverse((obj) => {
        // 해당 obj의 castShadow 속성값이 존재한다면 if block을 수행함. 기본적으로 모든 Object3D.castShadow는 false이기 때문에 아마 Object3D가 아닌 하위요소들에 대해서 실행하지 못하게 하려고 저 조건문을 쓴 거 같음. 
        if (obj.castShadow !== undefined) {
          // 모든 씬 그래프상의 Object3D 하위 요소들이 그림자를 드리울 수 있게 하고, 그림자를 받을 수도 있게 함.
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });

      /**
       * Object3D.getObjectByName(name: String)
       * 
       * 얘는 뭐냐면 해당 Object3D와 그것의 자식노드들 중에서 Object3D.name 속성값이 인자로 전달한 string name과 같은
       * Object3D 객체를 리턴해주는거임. 단, 가장 첫번째로 매칭되는 Object3D 객체를 리턴해 줌.
       * 기본적으로 Object3D.name 속성의 기본값은 empty string이므로, 이 메서드를 사용하려면 해당 속성값을 직접 지정해줘야 하지만,
       * 우리가 dumpObject함수를 호출해서 콘솔에 씬 그래프를 찍어봤듯이, 자동차 객체 전체를 담고있는 부모노드는
       * 'Cars'라는 name 속성값을 가지고 있기 때문에, 그냥 해당 문자열을 전달해주기만 하면 됨.
       */
      // cars = root.getObjectByName('Cars');
      const loadedCars = root.getObjectByName('Cars'); // 일단 자동차 객체들을 모두 감싸고 있는 부모노드인 Cars를 가져와서 할당해놓음.
      /**
       * fixes 배열을 왜 만들었냐면, 일단 아래의 내용을 알고 있어야 함.
       * 
       * 우리가 지금 Cars만 가져와서 걔내들의 자식노드를 animate 메서드에서 그냥 바로 y축으로 회전시켰더니
       * 자동차들마다 각자 다른 방향으로 회전을 하더라는 거지.
       * 
       * 왜? 자동차들마다 기준축이 다르거나, 초기의 rotation값이 제각각이기 때문임. 디자이너가 모델링할 때 이 부분을 고려하지 않은 것.
       * 그렇다고 해서 원본 파일에서 rotation값을 직접 수정하기는 번거로우니까
       * 각각의 자동차 객체를 Object3D 부모노드에 할당해서, 그 부모노드로 차를 움직이고,
       * 부모노드를 기준으로 각각의 자동차 객체의 position, rotation을 재설정하려는 거임.
       * 
       * 근데 콘솔로 씬 그래프를 찍어보니 자동차 객체들이 각각 CAR_03, Car_04, Car_08 이렇게 나뉘고 있고, 해당 이름을 포함하는 자동차 객체들끼리
       * 같은 방향으로 돌고 있는 것으로 봐서, 종류별로 rotation값을 재조정 해주면 될 거 같은거임.
       * 그래서 각 종류별 자동차 객체의 rotation값에 할당해 줄 각도값을 rot에 배열로 정의해 놓은거지.
       */
      const fixes = [{
          prefix: 'Car_08',
          y: 0, // y값을 추가해주는 이유는, curve를 생성해서 curve를 따라 각 자동차의 obj 객체를 움직이게 했더니 자동차 종류별로 y값(높이값)이 다르게 움직이는거임. 그래서 종류별로 자식노드인 자동차 객체의 높이값을 조금씩 조절해주려고 쓴 것.
          rot: [Math.PI * 0.5, 0, Math.PI * 0.5]
        },
        {
          prefix: 'CAR_03',
          y: 33,
          rot: [0, Math.PI, 0]
        },
        {
          prefix: 'Car_04',
          y: 40,
          rot: [0, Math.PI, 0]
        },
      ];

      // root 객체와 그것의 자식 노드들의 전역 변환을 업데이트 해주는 메서드
      // 아래의 for...of loop에서 각 자동채 객체별로 변환해주는 값들을 update 해주기 위해서 선언해놓은 것 같음... 이렇게 값을 변환하기 전 앞부분에 미리 선언해서 사용하는건가 봄.
      root.updateMatrixWorld();
      // loadedCars.children.slice()는 loadedCars안에 있는 자식노드들 배열을 처음부터 끝까지 복사하여 새로운 배열로 반환해 줌. 왜? slice에 따로 인덱스를 지정하지 않으면 그냥 원본 배열의 처음부터 끝까지 복사해주는 것.
      // 그래서 복사된 배열안에 들어있는 각각의 Cars의 자식노드인 자동차 객체들을 const car에 집어넣어서 for...of 반복문 안에서 뭔가를 처리해주는거임.
      for (const car of loadedCars.children.slice()) {
        /**
         * -Array.find(판별 함수(배열 요소)): 이 메서드는 배열의 각 요소를 인자로 전달받는 판별함수를 만족하는, 즉 true를 리턴해주는 맨 첫번째 요소를 리턴해 줌.
         * -String.startsWith(searchString): 이 메서드는 String 문자열이 인자로 전달한 searchString으로 시작하는지, 그렇지 않은지를 판단하여 true / false를 리턴해 줌.
         * 
         * 그니까 여기서는 지금 for...of에서 돌려주고 있는 각각의 자동차 객체의 name 속성값이 fixes안에 들어있는 3개의 prefix중 하나로 시작한다면 해당 fix 요소를 반환하여 const fix에 할당해주는 거임. 
         */
        const fix = fixes.find(fix => car.name.startsWith(fix.prefix));
        const obj = new THREE.Object3D(); // 각 자동차 객체의 부모노드로 지정해 줄 obj 객체를 만듦.
        // Object3D.getWorldPosition(Vector3): 이 메서드는 뭐냐면, 해당 Object3D의 전역공간 상에서의 위치값을 나타내는 Vector3D를 리턴해서 인자로 넘겨준 Vector3에 복사해 줌.
        // 그니까, 각 자동차 객체의 전역공간 상에서의 위치값을 부모노드가 될 obj의 위치값에 할당해줘서, 각 자동차 객체의 위치값을 부모노드에서 컨트롤하려고 한 것.
        car.getWorldPosition(obj.position);
        // 이미 부모노드의 위치값에 자동차 객체의 전역 위치값이 할당된 상태이니, 자식노드인 자동차 객체는 그냥 (0, 0, 0)으로 해두면 부모노드의 위치값을 따라가겠지
        // 다만, 부모노드의 위치값을 curve를 따로 움직이게 했더니 자동차 종류마다 y값이 다르더라는 거... 그래서 부모노드의 자식객체인 자동차 객체들을 종류별로 y값만 조금씩 조정해 줌.
        car.position.set(0, fix.y, 0);
        car.rotation.set(...fix.rot); // 각 자동차 객체별로 할당받은 fix값의 rot 배열의 각도값들을 하나하나 복사하여 car.rotation의 x, y, z에 각각 지정해 줌.
        obj.add(car); // 부모노드인 obj에 자동차 객체들을 각각 추가해주고
        scene.add(obj); // 부모노드들을 최상위 노드인 씬에 추가해주고
        cars.push(obj); // obj 부모노드들을 cars 배열에 차곡차곡 넣어줌. 이따가 animate 메서드에서 y축의 rotation을 돌릴 때 사용할거임.
      }

      const box = new THREE.Box3().setFromObject(root); // 해당 모델의 씬 객체를 감싸는 bounding box를 생성해 줌.

      const boxSize = box.getSize(new THREE.Vector3()).length(); // 해당 bounding box를 대각선으로 가로지르는 벡터의 길이를 구함.
      const boxCenter = box.getCenter(new THREE.Vector3()); // 해당 bounding box의 중심점 좌표값을 구함.

      // bounding box의 대각선의 절반값을 직각삼각형의 높이값으로 전달해서 frameArea를 호출함. 
      // 이 함수에서는 카메라 ~ bounding box 중심점까지의 단위벡터를 구해서 카메라의 위치값을 계산하고, 카메라 절두체의 크기를 boxSize를 기준으로 계산할거임.
      frameArea(boxSize * 0.5, boxSize, boxCenter, camera);

      // OrbitControls가 camera를 얼마나 멀리 Dolly out 할 수 있는지 최대값을 boxSize의 10배로 지정해 줌.
      controls.maxDistance = boxSize * 10;
      controls.target.copy(boxCenter); // boxCenter의 Vector3 좌표값을 OrbitControls가 camera를 움직일 때 바라볼 시야(target)의 Vector3 좌표값에 복사해 줌.
      controls.update(); // OrbitControls의 값이 바뀌었으니 업데이트 메서드를 호출해줘야 함.
    });
  }

  // resize renderer
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  // animate 메서드에서 각 자동차의 위치값과 타겟값을 계산하여 할당할 Vector3
  const carPosition = new THREE.Vector3(); // 각 자동차의 (임시) 현재 위치값
  const carTarget = new THREE.Vector3(); // 각 자동차가 lookAt하는 지점의 위치값

  // animate
  function animate(t) {
    t *= 0.001; // 밀리초 단위의 타임스탬프값을 초 단위로 변환해 줌.

    // 렌더러가 리사이징 되었다면 카메라의 비율(aspect)도 리사이징된 사이즈에 맞춰서 업데이트 해줘야 함.
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    // cars안에 있는 각각의 자동차 객체 부모노드 obj들의 현재 위치값과, lookAt할 위치값을 계산해 줌.
    {
      const pathTime = t * 0.01; // 선형 보간의 비율값을 매 프레임마다 변화시켜줄 값
      const targetOffset = 0.01; // lookAt할 위치값을 구할 때의 선형 보간의 비율값 계산에 필요한 offset 값
      cars.forEach((car, index) => {
        // index / cars.length는 결국 각각의 자동차 부모객체 obj마다 0 ~ 1사이의 값으로 계산이 될거고, pathTime은 시간이 지날때마다 값이 달라짐.
        // 그니까 u값은 자동차 부모객체마다, 시간이 지날때마다 달라지는 값
        const u = pathTime + index / cars.length;

        // Curve.getPointAt(비율값, Vector3) 메서드는 말 그대로 해당 curve의 비율값에 따른 Vector3 좌표값을 인자로 전달한 Vector3에 복사해 줌.
        // u값을 이용해서 curve상에 위치하는 carPosition 좌표값을 구하려는 것. 근데 u % 1 나머지값을 사용하는 이유는
        // u값에서 index/cars.length는 0 ~ 1 사이의 값이지만, pathTime은 시간이 지날수록 늘어나는 값이라서 1보다 커질 수 있음.
        // 근데 getPointAt은 0 ~ 1사이의 비율값만 넣어줄 수 있으므로 1로 나눠준 나머지값을 이용하면 시간이 지나서 pathTime이 1보다 커지더라도 0 ~ 1사이의 비율값을 반복해서 넣어줄 수 있음
        curve.getPointAt(u % 1, carPosition);
        /**
         * Vector3.applyMatrix4(Matrix)
         * 이 메서드는 Vector3에 인자로 전달하는 4*4 행렬(3D 컴퓨터 그래픽 상에서는 변환 매트릭스로 사용)을 곱해준 뒤, 원근법(perspective)로 나눠준다고 함.
         * 
         * Object3D.matrixWorld
         * 이 메서드는 해당 Object3D의 전역 공간 상에서의 변환 매트릭스 4*4 행렬을 리턴해 줌.
         * 
         * 그럼 이거는 결국 뭐냐면, 우리가 위에서 curve는 단순히 CatmullRomCurve3 메서드에 좌표값 배열을 받아서 계산되 '곡선 객체'에 불과하고,
         * carPosition은 그 곡선 객체 상에서의 좌표값을 받아놓은 Vector3에 불과함.
         * 
         * 그런데 curveObject는 curve를 이용해서 'Line 객체'로 만든거고, 얘를 도로 모형 수준으로 사이즈를 늘려놨기 때문에,
         * 실제로 자동차가 도로 위에서 움직이는 것처럼 보이게 하려면 curve 상의 좌표값이 아니라, 'curveObject 상의 좌표값'이 필요하다는 거임.
         * 
         * 그래서 curveObject의 전역공간 상에서의 변환 행렬을 carPosition(Vector3)에 곱해주면, 
         * 전역공간 상에서의 실제로 자동차의 부모노드 obj객체에 적용할 수 있는 위치값으로 변환할 수 있다는거지.
         */
        carPosition.applyMatrix4(curveObject.matrixWorld);

        // 자동차 부모노드 obj 객체가 lookAt할 타겟 좌표값도 구해줌. 이때 비율값은 carPosition을 구할 때 보다 0.01(targetOffset)만큼 앞에 있는 지점으로 할당해줄 것.
        curve.getPointAt((u + targetOffset) % 1, carTarget);
        carTarget.applyMatrix4(curveObject.matrixWorld); // 마찬가지로 lookAt할 좌표값을 전역공간 상에서의 위치값으로 변환해줘야 함.

        // carPosition 좌표값에 자동차를 임시로 일단 두도록 함.
        car.position.copy(carPosition); // Vector3.copy(Vector3) 뭔지 알지?
        car.lookAt(carTarget); // 자동차가 carTarget 지점을 lookAt 하도록 함.

        // 자동차 부모노드 obj 객체의 위치값을 carPosition과 carTarget의 중간 지점의 선형 보간된 벡터값으로 설정해 줌.
        car.position.lerpVectors(carPosition, carTarget, 0.5); // Vector3.lerpVectors()를 사용했다고 보면 됨. 모든 Object3D.position 값은 Vector3의 한 종류임.
      });
    }

    renderer.render(scene, camera);

    requestAnimationFrame(animate); // 내부적으로 반복 호출해주고
  }

  requestAnimationFrame(animate);
}

main();