import json
import re
from html.parser import HTMLParser

class ScheduleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.days = []
        self.current_day = None
        self.in_h2 = False
        self.in_th = False
        self.in_td = False
        self.in_span = False
        self.in_h5 = False
        self.in_a = False
        self.current_cell = None
        self.table_headers = []
        self.current_row_idx = 0
        self.current_cell_type = None

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == 'h2' and 'section-title' in attrs_dict.get('class', ''):
            self.in_h2 = True
        elif tag == 'table':
            self.table_headers = []
            self.current_row_idx = 0
        elif tag == 'th':
            self.in_th = True
        elif tag == 'td':
            self.in_td = True
            self.current_cell = {"time": "", "movie": "", "details": "", "link": ""}
        elif tag == 'span':
            self.in_span = True
            if 'movie-time' in attrs_dict.get('class', ''):
                self.current_cell_type = 'time'
            elif 'movie-details' in attrs_dict.get('class', ''):
                self.current_cell_type = 'details'
            else:
                self.current_cell_type = None
        elif tag == 'h5':
            self.in_h5 = True
        elif tag == 'a' and self.in_h5:
            self.in_a = True
            if 'href' in attrs_dict:
                self.current_cell['link'] = attrs_dict['href']

    def handle_endtag(self, tag):
        if tag == 'h2':
            self.in_h2 = False
        elif tag == 'th':
            self.in_th = False
        elif tag == 'td':
            self.in_td = False
            if self.current_day is not None and self.current_cell:
                loc_idx = len(self.current_day['all_slots_raw']) % len(self.table_headers)
                location = self.table_headers[loc_idx] if loc_idx < len(self.table_headers) else "Unknown"
                self.current_cell['location'] = location
                self.current_day['all_slots_raw'].append(self.current_cell)
            self.current_cell = None
        elif tag == 'span':
            self.in_span = False
            self.current_cell_type = None
        elif tag == 'h5':
            self.in_h5 = False
        elif tag == 'a':
            self.in_a = False
        elif tag == 'tr':
            self.current_row_idx += 1

    def handle_data(self, data):
        data = data.strip()
        if not data:
            return
        
        if self.in_h2:
            self.current_day = {"day": data, "all_slots_raw": []}
            self.days.append(self.current_day)
        elif self.in_th and self.current_row_idx == 0:
            if data and not data.isdigit():
                self.table_headers.append(data)
        elif self.in_td:
            if self.in_span:
                if self.current_cell_type == 'time':
                    self.current_cell['time'] += data
                elif self.current_cell_type == 'details':
                    self.current_cell['details'] += " " + data
            elif self.in_h5:
                self.current_cell['movie'] += " " + data

parser = ScheduleParser()
with open('Schedule_Midnight_Sun_Film_Festival.html', 'r', encoding='utf-8') as f:
    parser.feed(f.read())

final_screenings = []
for day_data in parser.days:
    day_name = day_data['day']
    for s in day_data['all_slots_raw']:
        movie_name = s['movie'].strip()
        if movie_name and movie_name != '---':
            time_part = s['time'].strip()
            movie_time = ""
            filmmaker = ""
            
            # Use regex for better time extraction
            time_match = re.match(r'^(\d{1,2}[:.]\d{2})', time_part)
            if time_match:
                movie_time = time_match.group(1).replace('.', ':')
                rest = time_part[len(time_match.group(1)):].strip()
                if rest.startswith(':'):
                    rest = rest[1:].strip()
                filmmaker = rest
            else:
                movie_time = time_part
                filmmaker = ""

            final_screenings.append({
                "day": day_name,
                "time": movie_time,
                "filmmaker": filmmaker,
                "location": s['location'],
                "movie": movie_name,
                "details": s['details'].strip(),
                "link": s['link']
            })

with open('schedule.json', 'w', encoding='utf-8') as f:
    json.dump(final_screenings, f, ensure_ascii=False, indent=2)

print("Parsed {} screenings across {} days.".format(len(final_screenings), len(parser.days)))
