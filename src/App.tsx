import React, { FC, useEffect, useRef, useState } from "react";
import "./style.scss";

type CornellNotesData = {
  title: string;
  ideas: Array<string>;
  notes: Array<string>;
  summary: string;
};

function saveDataToLocalStorage(data: CornellNotesData) {
  localStorage.setItem("autosave", JSON.stringify(data));
}

const DataAdder: FC<{
  onChange: (newList: Array<string>) => never | void;
  startValue: Array<string>;
}> = (props) => {
  const [currentList, setCurrentList] = useState<Array<string>>([]);
  const [input, setInput] = useState("");

  const [hasSetStartValue, setHasSetStartValue] = useState(false);

  const add = () => {
    const ncl = [...currentList, input];

    setCurrentList(ncl);
    props.onChange(ncl);
    setInput("");
  };

  if (!hasSetStartValue && props.startValue.length > 0) {
    setCurrentList(props.startValue);
    setHasSetStartValue(true);
  }

  return (
    <div className="dataAdder">
      <ul>
        {currentList.map((v, i) => (
          <li key={i}>
            {v}
            <button
              onClick={() => {
                props.onChange(currentList.filter((_, j) => i !== j));
                setCurrentList(currentList.filter((_, j) => i !== j));
              }}
              className="hideOnSave"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
      <div className="hideOnSave">
        <input
          type="text"
          className="adderInput"
          value={input}
          onChange={(evt) => setInput(evt.target.value)}
          placeholder="What to add"
        />
        <button type="button" onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
};

function saveFile(
  content: string,
  fileName: string,
  fileType: string = "text/plain"
) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: fileType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

const SaveLoad: FC<{ data: CornellNotesData }> = (props) => {
  const fileInput = useRef(null);

  const saveAsPDF = () => {
    print();
  };

  const saveAsXML = () => {
    const data = { ...props.data };

    const xml = document.implementation.createDocument("", "", null);
    const xml_objects = {
      title: xml.createElement("title"),
      ideas: xml.createElement("ideas"),
      notes: xml.createElement("notes"),
      summary: xml.createElement("summary"),
    };

    xml_objects.title.appendChild(xml.createTextNode(data.title));
    xml_objects.summary.appendChild(xml.createTextNode(data.summary));

    data.ideas.forEach((x) => {
      const ele = xml.createElement("item");
      ele.appendChild(xml.createTextNode(x));

      xml_objects.ideas.appendChild(ele);
    });

    data.notes.forEach((x) => {
      const ele = xml.createElement("item");
      ele.appendChild(xml.createTextNode(x));
      xml_objects.notes.appendChild(ele);
    });

    const root = xml.appendChild(xml.createElement("cornellnotes"));
    Object.values(xml_objects).forEach((x) => root.appendChild(x));

    saveFile(
      root.outerHTML,
      data.title + ".cornellnotes.xml",
      "application/xml"
    );
  };

  const loadFromXML = () => {
    if (!fileInput.current) return;
    const finput = fileInput.current as HTMLInputElement;
    finput.accept = "application/xml";
    finput.click();
    finput.onchange = async () => {
      if (!finput.files) return;
      const file = finput.files[0];

      const xml: HTMLDivElement = new DOMParser()
        .parseFromString(await file.text(), "application/xml")
        .querySelector("cornellnotes");

      if (!xml) {
        alert("Invalid XML");
        return;
      }

      if (
        !["title", "summary", "ideas", "notes"].every((x) =>
          xml.querySelector(x)
        )
      ) {
        alert("Invalid XML");
        return;
      }

      const data: CornellNotesData = {
        title: xml.querySelector("title").textContent,
        ideas: Array.from(xml.querySelectorAll("ideas > item")).map(
          (x) => x.textContent
        ),
        notes: Array.from(xml.querySelectorAll("notes > item")).map(
          (x) => x.textContent
        ),
        summary: xml.querySelector("summary").textContent,
      };

      localStorage.setItem("autosave", JSON.stringify(data));
      location.reload();
    };
  };

  return (
    <nav id="save" className="hideOnSave">
      <button type="button" onClick={saveAsPDF}>
        Save (pdf/print)
      </button>

      <button type="button" onClick={saveAsXML}>
        Save (XML)
      </button>

      <button type="button" onClick={loadFromXML}>
        Load from XML
      </button>

      <input type="file" ref={fileInput} style={{ display: "none" }} />
    </nav>
  );
};

const App: FC = () => {
  const [data, setData] = useState<CornellNotesData>({
    title: "Title",
    ideas: [],
    notes: [],
    summary: "",
  });

  function setDataValue(k: string, v: Array<string> | string) {
    const newData = { ...data };

    newData[k] = v;

    saveDataToLocalStorage(newData);
    setData(newData);
  }

  useEffect(() => {
    if (localStorage.getItem("autosave"))
      setData(JSON.parse(localStorage.getItem("autosave")!));
  }, []);

  return (
    <>
      <main>
        <section style={{ gridArea: "title" }}>
          <input
            type="text"
            onChange={(e) => setDataValue("title", e.target.value)}
            id="titleInput"
            placeholder="title"
            value={data.title}
          />
        </section>
        <section style={{ gridArea: "ideas" }}>
          <h2>Main Ideas</h2>

          <DataAdder
            onChange={(v) => setDataValue("ideas", v)}
            startValue={data.ideas}
          />
        </section>
        <section style={{ gridArea: "notes" }}>
          <h2>Notes</h2>

          <DataAdder
            onChange={(v) => setDataValue("notes", v)}
            startValue={data.notes}
          />
        </section>
        <section style={{ gridArea: "summary" }}>
          <h2>Summary</h2>
          <textarea
            placeholder="Summary..."
            onChange={(e) => setDataValue("summary", e.target.value)}
            value={data.summary}
          ></textarea>
        </section>
      </main>
      <SaveLoad data={data} />
      <footer id="madeWith">
        <p>Made with Cornell Notes Maker @ {location.host}</p>
      </footer>
    </>
  );
};

export default App;
