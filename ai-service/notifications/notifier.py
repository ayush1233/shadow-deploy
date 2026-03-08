import logging
from abc import ABC, abstractmethod
from typing import Dict, Any

class Notifier(ABC):
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        
    @abstractmethod
    def send(self, message: str, context: Dict[str, Any]) -> bool:
        pass
