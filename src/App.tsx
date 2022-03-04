import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: grid;
  justify-content: center;

  & > * {
    padding: 20px 0;
    margin: 0px;
  }

  & > .canvas-container {
    padding: 0;
    border: 2px solid lightgray;
    border-radius: 2px;
  }
`;

const maxWidth = 600;
const maxHeight = 600;

const App: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas>();

  const imageHandler = useCallback(
    (e) => {
      if (canvas) {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = function (file) {
          if (file.target) {
            const result = file.target.result as string;
            fabric.Image.fromURL(result, (image) => {
              image.set({
                selectable: false,
                hoverCursor: 'default',
                scaleX: maxWidth / image.width!,
                scaleY: maxHeight / image.height!,
              });

              canvas.remove(...canvas.getObjects());
              canvas.add(image);
            });
          }
        };

        reader.readAsDataURL(file);
      }
    },
    [canvas]
  );

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: maxWidth,
        height: maxHeight,
        selection: false,
        isDrawingMode: true,
        imageSmoothingEnabled: false,
        freeDrawingCursor: 'crosshair',
      });
      canvas.freeDrawingBrush.color = 'blue';

      const handleCreatedPath = (e: any) => {
        const path: fabric.Path = e['path'];

        // 생성된 path를 이용하여 polygon을 만들어 해당 영역에 덮어쓸 준비를 한다.
        const polygon = new fabric.Polygon(
          path
            .path!.flat()
            .filter((v) => typeof v === 'number')
            .reduce((pre, curr, index) => {
              if (index % 2 === 0) pre.push({ x: curr });
              else pre[Math.floor(index / 2)].y = curr;

              return pre;
            }, [] as any[]),
          { fill: 'white' }
        );

        // canvas에서 파란선을 제거하고 하얀 polygon만 남긴다.
        canvas.remove(path);
        canvas.add(polygon);

        // 이미지로 만들어 기존 이미지와 교체한다.
        const newImage = canvas.toDataURL({});
        fabric.Image.fromURL(newImage, (image) => {
          canvas.remove(...canvas.getObjects());
          canvas.add(image);
        });
      };

      canvas.on('path:created', handleCreatedPath);

      setCanvas(canvas);
    }
  }, []);

  useEffect(() => {
    // init default image
    fetch(`Lune.png`)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], 'Lune.png');
        imageHandler({ target: { files: [file] } });
      });
  }, [imageHandler]);

  return (
    <Wrapper>
      <h1>Lasso Demo</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <span>Selectable Image </span>
          <input type="file" accept="image/png, image/jpeg" onChange={imageHandler} />
        </div>
      </div>

      <canvas ref={canvasRef} />
    </Wrapper>
  );
};

export default App;
