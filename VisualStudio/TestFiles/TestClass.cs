using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LetsCollabTheme.TestFiles
{
    internal class TestClass
    {
        public TestClass()
        {
            var test = new TestClass2("string");
        }
        
    }
    
    internal class TestClass2
    {
        public string MyString { get; set; }
        
        public TestClass2(string myString)
        {
            MyString = myString;
        }

    }
}
