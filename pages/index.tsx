import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Draggable from 'react-draggable';

import React, { useState, useReducer, useEffect, useRef } from 'react';
import 'bulma/css/bulma.min.css';
import useWindowDimensions from './windowDimensions';
import Image from 'next/image';
import { prisma } from '../db'
import { cloneDeep } from 'lodash'

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }
  return result;
}

const Home: NextPage = ({ data }) => {
  
  const [modals, resetModals] = useReducer(setUpModals, []);
  const [visible, setVisibility] = useState(false);

  function setUpModals(state, action) {

    switch (action.type) {
      case 'NEW BOARD':
        state.map((mb) => {
          mb.status = false;
        })
        const temp = { name: 'Board' + state.length, status: true, id: makeid(6) }
        return [
          ...state,
          temp
        ]
      case 'DELETE TAB':
        var index;
        state.map((mb, i) => {
          if (mb.id == action.payload) {
            index = i;
          }
        })

        if (state.length > 1) {
          index == (state.length - 1) ? state[index - 1].status = true : state[index + 1].status = true;
        } else {
          state.push({ name: "MoodBoard", id: makeid(6), status: true })
        }

        return [
          ...state.filter((mb) => mb.id !== action.payload)
        ]
      case 'CLOSE MODAL':
        state.map((mb) => {
          mb.status = false;
        })
        
        return [
          ...state
        ]
      case 'OPEN MODAL':
        if (state.length == 0) {
          state.push({ name: "MoodBoard", id: makeid(6) })
        }
        state[0].status = true;
        
        return [
          ...state
        ]
      case 'SET BOARD':
        state.map((mb) => {
          mb.status = (mb.id == action.payload) ? true : false;
        })
        return [
          ...state
        ]
      
      default:
        console.log('something wrong');
    }
  }

  return (
    <div>
      <button onClick={() => {resetModals({ type: (visible ? 'CLOSE MODAL' : 'OPEN MODAL') }); setVisibility(!visible)}} className="button is-primary">{visible ? "Close" : "Open"} Moodboard</button>

      {modals.map((mb) => {
        return <Modal key={mb.id} modalControl={resetModals} dataImgs={data} toOpen={mb.status} modals={modals} />
      })}
      <Draggable><h1>To get the best experience, use a consistent screen size </h1></Draggable>

    </div>
  );
}

export async function getStaticProps() {

  const data = await prisma.items.findMany();

  // Pass data to the page via props
  return { props: { data } }
}

function Modal({ modalControl, dataImgs, toOpen, modals }) {
  const [drop, setDrop] = useState(false);
  const [imprt, setImport] = useState(false);
  const [texts, setTexts] = useReducer(addToBoard, []);
  const [imgs, setImgs] = useReducer(addImgToBoard, []);
  const [swatches, setSwatches] = useReducer(addToBoard, []);
  const control = { setImgs: setImgs, setTexts: setTexts, setSwatches: setSwatches };
  const access = { imgs: imgs, texts: texts, swatches: swatches };

  function addImgToBoard(state, action) {
    switch (action.type) {
      case 'ADD_IMAGE':
        action.payload.img.x = Math.floor(Math.random() * 400);
        action.payload.img.y = Math.floor(Math.random() * 250);
        action.payload.img.width = 150;
        action.payload.img.uniqueId = makeid(6);
        return [
          ...state,
          structuredClone(action.payload.img)
        ]
      case 'UPDATE LIST':
        return [
          ...action.payload
        ]
      case 'REMOVE':
        return [
          ...state.slice(0, action.payload), ...state.slice(action.payload + 1)
        ]
      case 'CLEAR':
        return []
    }
  }
  function addToBoard(state, action) {

    switch (action.type) {
      case 'ADD':
        const temp = { item: action.payload, x: 0, y: 35, id: makeid(6) }
        return [
          ...state,
          temp
        ]
      case 'UPDATE LIST':
        state[action.payload.index].item = action.payload.color;
        return [
          ...state
        ]
      case 'REMOVE':
        return [
          ...state.slice(0, action.payload), ...state.slice(action.payload + 1)
        ]
      case 'CLEAR':
        return []
    }
  }
  if (toOpen)
    return (
      

        <div className="innerModal">
          <ModalHeader dropdown={{ dr: drop, openSelection: () => setDrop(!drop) }} dataImgs={dataImgs} control={control} tabs={{ modals: modals, control: modalControl }} createText={{ imprt: imprt, setImport: () => setImport(!imprt) }} />

          <Moodboard access={access} control={control} />
        </div>
     
    );
}

function ModalHeader({ dropdown, createText, dataImgs, control, tabs }) {
  //
  return (
    <nav className="navbar" style={{ height: '40px', borderRadius: '20%' }}>


      <div className="navbar-menu">
        <div className="navbar-start">
          <div className="tabs is-boxed">
            <ul>
              {tabs.modals.map((mb) => {
                return (
                  <li className={mb.status ? 'is-active' : undefined} key={mb.id + 'a53'}>
                    <a onClick={mb.status ? undefined : (() => tabs.control({ type: 'SET BOARD', payload: mb.id }))}>
                      {mb.name}  {mb.status ? <button className="delete is-small" style={{ marginLeft: '7px' }} onClick={() => tabs.control({ type: 'DELETE TAB', payload: mb.id })}></button> : ""}
                    </a>

                  </li>


                );
              })}

              <li>
                <a onClick={() => tabs.control({ type: 'NEW BOARD' })}>
                  +
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="navbar-end">

          <button className="button" onClick={() => {
            let text = "Are you sure?\nThis action is irreversible.";
            if (confirm(text) == true) {
              control.setImgs({ type: 'CLEAR' })
              control.setTexts({ type: 'CLEAR' })

            }
          }
          }>
            <span>Clear</span>
            <span className="icon is-small">
              <i className="fas fa-angle-down" aria-hidden="true"></i>
            </span>
          </button>



          <button className="button" onClick={() => {
            if (dropdown.dr) {
              dropdown.openSelection();
            }
            createText.setImport();
          }} >
            <span>Import</span>
            <span className="icon is-small">
              <i className="fas fa-angle-down" aria-hidden="true"></i>
            </span>
          </button>

          {createText.imprt && <ImportTextDrop control={control} closeImporting={createText.setImport} />}

          <button className="button" aria-haspopup="true" aria-controls="dropdown-menu" onClick={() => {
            if (createText.imprt) {
              createText.setImport();
            }
            dropdown.openSelection()
          }}>
            <span>Company Images</span>
            <span className="icon is-small">
              <i className="fas fa-angle-down" aria-hidden="true"></i>
            </span>
          </button>

          {dropdown.dr && <Dropdown dataImgs={dataImgs} control={control.setImgs} />}

        </div>
      </div>
    </nav>

  );
}
function ImportTextDrop({ control, closeImporting }) {
  const [inp, setInp] = useState("")

  return (
    <div className="dropdown is-active is-right" >
      <div className="dropdown-menu" id="dropdown-menu" role="menu">
        <div className="dropdown-content" >
          <div className="dropdown-item">
            <input className="input is-primary" type="text" placeholder="Enter text here" style={{ marginBottom: "15px" }} value={inp} onChange={e => setInp(e.target.value)} onKeyPress={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                inp !== "" ? control.setTexts({ type: 'ADD', payload: inp }) : undefined;
                closeImporting();
              }
            }} />
            <button className="button is-primary" style={{ margin: "0px" }} onClick={() => {
              inp !== "" ? control.setTexts({ type: 'ADD', payload: inp }) : undefined;
              closeImporting();
            }}>Create</button>
          </div>
          <hr style={{ padding: "1.1px", backgroundColor: '#0F1510' }}></hr>
          <button className="button is-primary" style={{ margin: "10px 15px" }} onClick={() => {
            control.setSwatches({ type: 'ADD', payload: "#" + Math.floor(Math.random()*16777215).toString(16)})
            closeImporting();
          }}>New Color Swatch</button>
        </div>
      </div>
    </div>
  )
}
function Moodboard({ access, control }) {
  const ref = useRef(null);
  const [st, setSt] = useState(0);

  const handleDrag = (e, ui, index, type) => {
    setSt((n) => n + 1);
    if (type == "img") {
      access.imgs.map((img, i) => {
        if (index == i) {
          img.x = img.x + ui.deltaX;
          img.y = img.y + ui.deltaY;
        }
      })
    } else if (type == "txt") {
      access.texts.map((text, i) => {
        if (index == i) {
          text.x = text.x + ui.deltaX;
          text.y = text.y + ui.deltaY;
        }
      })
    } else if (type == "swt") {
      access.swatches.map((swt, i) => {
        if (index == i) {
          swt.x = swt.x + ui.deltaX;
          swt.y = swt.y + ui.deltaY;
        }
      })
    }

  }
  return (
    <div className="expand" >

      <Draggable bounds=".expand" >
        <h1 className='draggable'>{access.imgs.length + access.texts.length + access.swatches.length}</h1>
      </Draggable>

      {access.texts.map((text, i) => {

        return (
          <Draggable bounds={{ top: 0, left: -5, right: 10000, bottom: 10000 }} defaultClassName='column is-1 draggable' key={text.id} defaultPosition={{ x: text.x, y: text.y }} onDrag={(e, ui) => handleDrag(e, ui, i, "txt")}>
            <div>
              <h1 onDoubleClick={() => { control.setTexts({ type: 'REMOVE', payload: i }) }}>{text.item}</h1>
            </div>
          </Draggable>
        )

      })}
      {access.swatches.map((color, i) => {

        return (
          <Draggable bounds={{ top: 10, left: 0, right: 10000, bottom: 10000 }} defaultClassName='column is-2 draggable' key={color.id} defaultPosition={{ x: color.x, y: color.y + i * 10 }} onDrag={(e, ui) => handleDrag(e, ui, i, "swt")}>

            <div onDoubleClick={() => control.setSwatches({ type: 'REMOVE', payload: i })}>
              <input type="color" style={{ backgroundColor: color.item }} className='swatch' value={color.item} onChange={(e) => {
                control.setSwatches({
                  type: "UPDATE LIST", payload: ({ index: i, color: e.target.value })
                })

              }} />
            </div>


          </Draggable>
        )

      })}

      {access.imgs.map((img, i) => {
        
        return (
          <React.Fragment >
            <Draggable  defaultClassName='column draggable' key={img.uniqueId} defaultPosition={{ x: img.x, y: img.y }} onDrag={(e, ui) => handleDrag(e, ui, i, "img")} >
              <div>
                <img src={img.image_path} alt="bruh" draggable={false} style={{ width: img.width }}/>
                <button className='delete is-small'  onClick={() => control.setImgs({ type: 'REMOVE', payload: i })} />
              </div>
            </Draggable>

            <Draggable key={img.uniqueId + 'b52'} position={{ x: (img.x + img.width)*2, y: (img.y + img.width)*2 }} onDrag={(e, ui) => {
              if ((img.width + ui.deltaX) < 100) {
                img.width = 100;
              } else if((img.width + ui.deltaX) > 500){
                img.width = 500
              } else {
                img.width = (img.width + ui.deltaX);
                setSt((n) => n + 1)
              }

            }} >
              <button className='resizeButton '></button>
            </Draggable>
            

          </React.Fragment>
        )
      })}









    </div>
  );
}

function Dropdown({ dataImgs, control }) {

  return (
    <div className="dropdown is-active is-right" >
      <div className="dropdown-menu" id="dropdown-menu" role="menu">
        <div className="dropdown-content dropwidth" >
          <div className="dropdown-item">
            <Selection dataImgs={dataImgs} control={control} />

          </div>

        </div>
      </div>
    </div>

  );
}

function Selection({ dataImgs, control }) {
  const [category, setCategory] = useState(dataImgs[0].category_name);
  const categories = [];
  dataImgs.map((img) => {
    if (categories.indexOf(img.category_name) < 0) {
      categories.push(img.category_name);
    }
  });

  return (
    <div className="columns" >
      <article className="panel is-info categScroll">
        <div className="panel-block">
          <input className="input is-info" type="text" placeholder="Search" />
        </div>
        {categories.map((cat) => {
          if (cat == category) {
            return <a className="panel-block is-active">
              {cat}
            </a>
          } else {
            return <a className="panel-block" onClick={() => setCategory(cat)}>
              {cat}
            </a>
          }
        })}
      </article>
      <div className="column is-four-fifths categScroll">
        <CategoryImages category={category} dataImgs={dataImgs} control={control} />
      </div>
    </div>
  );
}

function CategoryImages({ category, dataImgs, control }) {
  const filteredData = dataImgs.filter((img) => img.category_name == category);

  return (
    <div className="columns is-multiline is-variable is-1">
      {filteredData.map((img) => {
        return (
          <a className='column is-one-quarter' style={{ backgroundColor: 'white' }} onClick={() => control({ type: 'ADD_IMAGE', payload: { img } })}>
            <div className="card">
              <div className="card-image">
                <figure className="image is-128x128">
                  <img src={img.image_path} alt="Placeholder image" />
                </figure>
              </div>
              <div className="card-content">
                <p className="title is-7">{img.name}</p>
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}





export default Home;



