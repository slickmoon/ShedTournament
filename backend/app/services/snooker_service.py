from sqlalchemy.orm import Session

# Simple in-memory state; replace with DB if needed
_state = {
    'top': 0,
    'bottom': 0,
    'colours_enabled': {
        'yellow': False,
        'green': False,
        'brown': False,
        'blue': False,
        'pink': False,
        'black': False
    },
    'red_enabled': True,
    'red_count': 15,
}
# Map colour names to their snooker point values
colour_values = {
    'yellow': 2,
    'green': 3,
    'brown': 4,
    'blue': 5,
    'pink': 6,
    'black': 7
}

class SnookerService:
    @staticmethod
    def get_state(db: Session) -> dict:
        return dict(_state)

    @staticmethod
    def apply_action(db: Session, action: dict) -> dict:
        action_type = action.get('type')
        slot = action.get('slot')
        colour = action.get('colour')

        if action_type == 'reset':
            _state['top'] = 0
            _state['bottom'] = 0
            _state['red_count'] = 15
            _state['colours_enabled'] = {
                'yellow': False,
                'green': False,
                'brown': False,
                'blue': False,
                'pink': False,
                'black': False
            }
            _state['red_enabled'] = True
            return dict(_state)

        if action_type == 'red':
            if _state['red_count'] <= 0:
                _state['red_enabled'] = False
                return dict(_state)
            if slot in ('top', 'bottom') and _state['red_count'] > 0:
                _state[slot] += 1
                _state['colours_enabled'] = {k: True for k in _state['colours_enabled']}
                _state['red_count'] -= 1
            return dict(_state)

        if action_type == 'colour':
            value = colour_values.get(colour)
            if _state['colours_enabled'].get(colour, False) and slot in ('top', 'bottom') and isinstance(value, int):
                _state[slot] += value
                if _state['red_enabled']:
                    _state['colours_enabled'] = {k: False for k in _state['colours_enabled']}
                    if _state['red_count'] <= 0:
                        _state['red_enabled'] = False
                        _state['colours_enabled'] = {k: True for k in _state['colours_enabled']}
                else: #no reds, only allow unsunk balls
                    _state['colours_enabled'][colour] = False
            return dict(_state)

        if action_type == 'miss':
            _state['colours_enabled'] = {k: False for k in _state['colours_enabled']}
            return dict(_state)

        if action_type == 'foul':
            if slot in ('top', 'bottom'):
                _state[slot] -= 4
            _state['colours_enabled'] = {k: False for k in _state['colours_enabled']}
            return dict(_state)

        if action_type == 'foul_red':
            if slot in ('top', 'bottom') and _state['red_count'] > 0:
                _state[slot] -= 4
                _state['red_count'] -= 1
            _state['colours_enabled'] = {k: False for k in _state['colours_enabled']}
            if _state['red_count'] <= 0:
                _state['red_enabled'] = False
                _state['colours_enabled'] = {k: True for k in _state['colours_enabled']}
            return dict(_state)

        if action_type == 'foul_colour':
            value = colour_values.get(colour)
            if slot in ('top', 'bottom') and isinstance(value, int):
                _state[slot] -= value
                if _state['red_enabled']:
                    _state['colours_enabled'] = {k: False for k in _state['colours_enabled']}
                else: #no reds, only allow unsunk balls
                    _state['colours_enabled'][colour] = False
            return dict(_state)

        return dict(_state)


