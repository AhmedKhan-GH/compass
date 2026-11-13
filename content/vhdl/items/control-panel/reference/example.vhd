library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        status : in std_logic_vector(7 downto 0);
        mask : in std_logic_vector(7 downto 0);
        critical : in std_logic;
        warning : in std_logic;
        shown : out std_logic_vector(7 downto 0);
        alert_code : out std_logic_vector(1 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    shown <= status and mask;
    alert_code <= "10" when critical='1' else "01" when warning='1' else "00";
end architecture;
