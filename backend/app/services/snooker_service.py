from sqlalchemy.orm import Session

# Simple in-memory state; replace with DB if needed
_state = {
    'top': 0,
    'bottom': 0,
    'colours_enabled': False,
}


class SnookerService:
    @staticmethod
    def get_state(db: Session) -> dict:
        return dict(_state)

    @staticmethod
    def apply_action(db: Session, action: dict) -> dict:
        action_type = action.get('type')
        slot = action.get('slot')
        value = action.get('value')

        if action_type == 'reset':
            _state['top'] = 0
            _state['bottom'] = 0
            _state['colours_enabled'] = False
            return dict(_state)

        if action_type == 'red':
            if slot in ('top', 'bottom'):
                _state[slot] += 1
                _state['colours_enabled'] = True
            return dict(_state)

        if action_type == 'colour':
            if _state['colours_enabled'] and slot in ('top', 'bottom') and isinstance(value, int):
                _state[slot] += value
                _state['colours_enabled'] = False
            return dict(_state)

        if action_type == 'miss':
            _state['colours_enabled'] = False
            return dict(_state)

        if action_type == 'foul':
            if slot in ('top', 'bottom'):
                _state[slot] -= 4
            _state['colours_enabled'] = False
            return dict(_state)

        if action_type == 'foul_colour':
            if slot in ('top', 'bottom') and isinstance(value, int):
                _state[slot] -= value
            _state['colours_enabled'] = False
            return dict(_state)

        return dict(_state)


