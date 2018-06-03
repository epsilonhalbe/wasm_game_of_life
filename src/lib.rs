#![feature(proc_macro, wasm_custom_section, wasm_import_module)]

extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern {
    #[wasm_bindgen(js_namespace = console)]
    fn time(name: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn timeEnd(name: &str);
}

pub struct Timer<'a> {
    name: &'a str,
}

impl<'a> Timer<'a> {
    pub fn new(name: &'a str) -> Timer<'a> {
        time(name);
        Timer { name }
    }
}

impl<'a> Drop for Timer<'a> {
    fn drop(&mut self) {
        timeEnd(self.name);
    }
}

#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead  = 0,
    Alive = 1,
}

#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: Vec<Cell>,
}

/// Public methods, exported to JavaScript.
#[wasm_bindgen]
impl Universe {
    pub fn new() -> Universe {
        let width  = 64;
        let height = 64;
        let cells  = (0..height * width).map(|i| {
            match i {
                1|2|66|130|194|257|258|2080|2081|2144|2145
                    => Cell::Alive,
                _   => Cell::Dead,
            }
        }).collect();
        Universe {
            width,
            height,
            cells,
        }
    }

    pub fn width(&self)  -> u32 { self.width  }
    pub fn height(&self) -> u32 { self.height }
    pub fn cells(&self) -> *const Cell {
        self.cells.as_ptr()
    }

    pub fn tick(&mut self) {
        // let _timer = Timer::new("Universe::tick");
        let mut next = self.cells.clone(); 

        for x in 0..self.width {
            for y in 0..self.height {
                let k = 3 * self.lvl1_neighbour_count(x, y)
                      +     self.lvl2_neighbour_count(x, y);
                next[self.get_index(x, y)] =
                    match self.get(x,y) {
                      Cell::Alive => if 6 <= k && k <= 10 { Cell::Alive } else { Cell::Dead },
                      Cell::Dead  => if 7 <= k && k <=  9 { Cell::Alive } else { Cell::Dead },
                    };
            }
        }
        self.cells = next;
    }
}

/// Private methods.
impl Universe {
    fn get_index(&self, x: u32, y: u32) -> usize {
        let x_ = if x < self.width  { x } else { x - self.width  };
        let y_ = if y < self.height { y } else { y - self.height };
        (x_ + y_ * self.width) as usize
    }

    fn get(&self, x: u32, y: u32) -> Cell {
        self.cells[self.get_index(x,y)]
    }

    fn lvl1_neighbour_count(&self, x: u32, y: u32) -> u8 {
        let xx = x+self.width;
        let yy = y+self.height;
        [    (x,y+1),(x+1,y+1)
        ,(xx-1,y)/*(x,y)*/,(x+1,y)
        ,    (x,yy-1),(x+1,yy-1)
        ].iter().map(|(x_,y_)| {
            self.get(*x_, *y_) as u8
        }).sum()
    }

    fn lvl2_neighbour_count(&self, x: u32, y: u32) -> u8 {
        let xx = x+self.width;
        let yy = y+self.height;
        [          (x,y+2),
         (xx-1,y+1),        (x+2,y+1),
                  /*(x,y)*/
         (xx-1,yy-1),        (x+2,yy-1),
                   (x,yy-2)
        ].iter()
         .map(|(x_,y_)| {
            self.get(*x_, *y_) as u8
        }).sum()
    }
}
