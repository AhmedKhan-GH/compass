library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
package weather_pkg is type weather_report_t is record
    temperature : integer range -128 to 127;
    humidity : natural range 0 to 100;
    valid : std_logic;
end record weather_report_t;
function pack (
    r:weather_report_t
    ) return std_logic_vector;
    function unpack (
        w:std_logic_vector(15 downto 0)
        ) return weather_report_t;
    end package weather_pkg;
    package body weather_pkg is function pack (
        r:weather_report_t
        ) return std_logic_vector is
        begin
        return (15 downto 0=> '0');
    end function pack;
    function unpack (
        w:std_logic_vector(15 downto 0)
        ) return weather_report_t is
        variable r : weather_report_t;
        begin
        r :=(temperature=> 0, humidity=> 0, valid=> '0');
        return r;
    end function unpack;
end package body weather_pkg;
