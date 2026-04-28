
import codecs
try:
    with codecs.open('c:\\Users\\Deepak\\Desktop\\kravv\\api_test_output.txt', 'r', 'utf-16') as f:
        print(f.read())
except Exception as e:
    print(f"Error: {e}")
